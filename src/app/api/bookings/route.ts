import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteCustomItinerary, computeReservationDue } from "@/lib/pricing";
import { remainingCapacity } from "@/lib/availability";
import { bookingCode } from "@/lib/format";
import { dispatchQueuedSms } from "@/lib/sms";

const MUNICIPALITY_ID = 1;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    bookingType,
    visitDate,
    adults = 1,
    children = 0,
    touristName,
    touristMobile,
    touristEmail,
    touristOrigin,
    transportRouteId,
    packageId,
    destinationIds = [],
    baggageKg = 0,
    baggageNotes = "",
  } = body;

  if (!touristName || !touristMobile) {
    return NextResponse.json({ error: "Name and mobile number are required." }, { status: 400 });
  }
  if (!visitDate) {
    return NextResponse.json({ error: "Please choose a visit date." }, { status: 400 });
  }

  const pax = Math.max(1, Number(adults) + Number(children));
  const date = new Date(visitDate);

  const muni = await prisma.municipality.findUnique({ where: { id: MUNICIPALITY_ID } });
  const expiresAt = new Date(Date.now() + (muni?.reservationExpiryHours ?? 24) * 3600 * 1000);

  let total = 0;
  let reservationDue = 0;
  let feeLines: { feeCode: string; label: string; quantity: number; unitAmount: number; lineTotal: number }[] = [];
  let destIds: number[] = [];

  if (bookingType === "package") {
    const pkg = await prisma.tourPackage.findUnique({
      where: { id: Number(packageId) },
      include: { destinations: true },
    });
    if (!pkg) return NextResponse.json({ error: "Package not found." }, { status: 404 });
    if (pax < pkg.minPax || pax > pkg.maxPax) {
      return NextResponse.json({ error: `This package accepts ${pkg.minPax}–${pkg.maxPax} travelers.` }, { status: 400 });
    }
    destIds = pkg.destinations.map((d) => d.destinationId);
    total = pkg.pricePerPax * pax;
    const resFee = await prisma.feeSetting.findFirst({ where: { municipalityId: MUNICIPALITY_ID, feeCode: "RESERVATION" } });
    reservationDue = computeReservationDue(total, resFee?.calcType, resFee?.amount);
    feeLines = [{ feeCode: "PACKAGE", label: `${pkg.name} (${pax} pax)`, quantity: pax, unitAmount: pkg.pricePerPax, lineTotal: total }];
  } else {
    destIds = (destinationIds as any[]).map(Number);
    if (destIds.length === 0) return NextResponse.json({ error: "Add at least one destination." }, { status: 400 });
    const quote = await quoteCustomItinerary({
      municipalityId: MUNICIPALITY_ID,
      destinationIds: destIds,
      adults: Number(adults),
      children: Number(children),
      transportRouteId: transportRouteId ? Number(transportRouteId) : null,
    });
    total = quote.total;
    reservationDue = quote.reservationDue;
    feeLines = quote.lines;
  }

  // Capacity guard (server-side, authoritative)
  for (const id of destIds) {
    const remaining = await remainingCapacity(id, date);
    if (remaining < pax) {
      const dest = await prisma.destination.findUnique({ where: { id } });
      return NextResponse.json(
        { error: `${dest?.name ?? "A destination"} only has ${remaining} slot(s) left on that date.` },
        { status: 409 },
      );
    }
  }

  const code = bookingCode();
  const booking = await prisma.booking.create({
    data: {
      bookingCode: code,
      municipalityId: MUNICIPALITY_ID,
      bookingType: bookingType === "package" ? "package" : "custom",
      packageId: bookingType === "package" ? Number(packageId) : null,
      touristName,
      touristMobile,
      touristEmail: touristEmail || null,
      touristOrigin: touristOrigin || null,
      paxAdults: Number(adults),
      paxChildren: Number(children),
      visitDate: date,
      transportRouteId: transportRouteId ? Number(transportRouteId) : null,
      baggageKg: Math.max(0, Math.min(200, Number(baggageKg) || 0)),
      baggageNotes: String(baggageNotes ?? "").trim() || null,
      totalAmount: total,
      reservationDue,
      status: "pending_payment",
      expiresAt,
      destinations: {
        create: destIds.map((destinationId, i) => ({ destinationId, visitOrder: i + 1, visitDate: date })),
      },
      fees: { create: feeLines },
      statusLogs: { create: { toStatus: "pending_payment", note: "Booking submitted by tourist" } },
    },
  });

  // Queue an SMS (logged only — wire to Semaphore in production)
  await prisma.smsLog.create({
    data: {
      bookingId: booking.id,
      recipientMobile: touristMobile,
      recipientType: "tourist",
      template: "BOOKING_CREATED",
      message: `Bagulin Tourism: Booking ${code} created. Pay reservation fee of PHP ${reservationDue} within 24h to confirm.`,
    },
  });

  await dispatchQueuedSms(booking.id);
  return NextResponse.json({ bookingCode: code, reservationDue, total });
}
