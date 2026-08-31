import { NextResponse } from "next/server";
import { prisma, getMunicipalityId } from "@/lib/prisma";
import { quoteCustomItinerary, computeReservationDue } from "@/lib/pricing";
import { remainingCapacity } from "@/lib/availability";
import { bookingCode } from "@/lib/booking-code";
import { grantBookingAccess } from "@/lib/booking-access";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { dispatchQueuedSms } from "@/lib/sms";

/** Max destinations in one custom itinerary — also caps the per-request DB work. */
const MAX_DESTINATIONS = 12;
const MAX_PAX = 100;

/** Accepts 09XXXXXXXXX, +639XXXXXXXXX and 639XXXXXXXXX; returns digits or null. */
function normalizeMobile(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("63") && d.length === 12) return `0${d.slice(2)}`;
  if (d.startsWith("0") && d.length === 11 && d[1] === "9") return d;
  if (d.length === 10 && d.startsWith("9")) return `0${d}`;
  return null;
}

export async function POST(req: Request) {
  // Every booking queues an SMS through a paid gateway (src/lib/sms.ts), so an
  // unthrottled endpoint here is both a spam vector and a billing one.
  const ip = clientIpFrom(req);
  const limit = rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts from this connection. Please try again later or call the Tourism Office." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

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

  const name = String(touristName ?? "").trim().slice(0, 120);
  const mobile = normalizeMobile(String(touristMobile ?? ""));
  const email = String(touristEmail ?? "").trim().slice(0, 160);
  const origin = String(touristOrigin ?? "").trim().slice(0, 120);

  if (!name) {
    return NextResponse.json({ error: "Please enter the lead traveler's name." }, { status: 400 });
  }
  if (!mobile) {
    return NextResponse.json({ error: "Please enter a valid Philippine mobile number (e.g. 0917 123 4567)." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }
  if (!visitDate) {
    return NextResponse.json({ error: "Please choose a visit date." }, { status: 400 });
  }

  const date = new Date(visitDate);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Please choose a valid visit date." }, { status: 400 });
  }
  // Compare on date boundaries so a booking made today for today still passes.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return NextResponse.json({ error: "Visit date cannot be in the past." }, { status: 400 });
  }
  const oneYearOut = new Date(today.getTime() + 365 * 24 * 3600 * 1000);
  if (date > oneYearOut) {
    return NextResponse.json({ error: "Bookings can only be made up to a year ahead." }, { status: 400 });
  }

  const numAdults = Math.max(1, Math.min(MAX_PAX, Math.floor(Number(adults)) || 1));
  const numChildren = Math.max(0, Math.min(MAX_PAX, Math.floor(Number(children)) || 0));
  const pax = numAdults + numChildren;
  if (pax > MAX_PAX) {
    return NextResponse.json({ error: `Groups larger than ${MAX_PAX} need to be arranged with the Tourism Office directly.` }, { status: 400 });
  }

  const municipalityId = await getMunicipalityId();
  const muni = await prisma.municipality.findUnique({ where: { id: municipalityId } });
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
    const resFee = await prisma.feeSetting.findFirst({ where: { municipalityId, feeCode: "RESERVATION" } });
    reservationDue = computeReservationDue(total, resFee?.calcType, resFee?.amount);
    feeLines = [{ feeCode: "PACKAGE", label: `${pkg.name} (${pax} pax)`, quantity: pax, unitAmount: pkg.pricePerPax, lineTotal: total }];
  } else {
    // De-duplicate and cap: each id costs several queries below, so an oversized
    // array would turn one request into a lot of database work.
    destIds = [...new Set((destinationIds as any[]).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (destIds.length === 0) return NextResponse.json({ error: "Add at least one destination." }, { status: 400 });
    if (destIds.length > MAX_DESTINATIONS) {
      return NextResponse.json({ error: `An itinerary can include up to ${MAX_DESTINATIONS} destinations.` }, { status: 400 });
    }
    const quote = await quoteCustomItinerary({
      municipalityId,
      destinationIds: destIds,
      adults: numAdults,
      children: numChildren,
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

  const code = await bookingCode();
  const booking = await prisma.booking.create({
    data: {
      bookingCode: code,
      municipalityId,
      bookingType: bookingType === "package" ? "package" : "custom",
      packageId: bookingType === "package" ? Number(packageId) : null,
      touristName: name,
      touristMobile: mobile,
      touristEmail: email || null,
      touristOrigin: origin || null,
      paxAdults: numAdults,
      paxChildren: numChildren,
      visitDate: date,
      transportRouteId: transportRouteId ? Number(transportRouteId) : null,
      baggageKg: Math.max(0, Math.min(200, Number(baggageKg) || 0)),
      baggageNotes: String(baggageNotes ?? "").trim().slice(0, 300) || null,
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

  // Record an in-app notification (read by staff in the admin log — no SMS gateway)
  await prisma.smsLog.create({
    data: {
      bookingId: booking.id,
      recipientMobile: mobile,
      recipientType: "tourist",
      template: "BOOKING_CREATED",
      message: `Bagulin Tourism: Booking ${code} created. Pay reservation fee of PHP ${reservationDue} within 24h to confirm.`,
    },
  });

  await dispatchQueuedSms(booking.id);

  // The submitter obviously owns this booking — let them straight into
  // /booking/[code] without bouncing through the /my-booking identity check.
  await grantBookingAccess(code);

  return NextResponse.json({ bookingCode: code, reservationDue, total });
}
