import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPass } from "@/lib/qr";
import { getSessionUser } from "@/lib/auth";

/**
 * Marks a tourist's arrival at the site. Accepts either a scanned pass token or
 * a manually-entered booking code. Enforces the closed loop: only an APPROVED,
 * paid booking can check in, and a pass can't be scanned twice. On success the
 * booking becomes `checked_in`, the QR pass is stamped, and each assigned guide's
 * duty is marked completed — giving the office real, auditable attendance.
 */
export async function POST(req: Request) {
  const staff = await getSessionUser();
  if (!staff) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const codeInput = String(body.code ?? "").trim().toUpperCase();

  let bookingCode = codeInput;
  if (token) {
    const claim = verifyPass(token);
    if (!claim) return NextResponse.json({ error: "Invalid or tampered QR pass." }, { status: 400 });
    bookingCode = claim.bookingCode;
  }
  if (!bookingCode) return NextResponse.json({ error: "Scan a pass or enter a booking code." }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } },
      assignments: { include: { guide: true } },
      qrPass: true,
    },
  });
  if (!booking) return NextResponse.json({ error: `No booking found for ${bookingCode}.` }, { status: 404 });

  // Same QR scan surfaces product pickups — one stop for the tourist and the office.
  const productOrders = await prisma.productOrder.findMany({
    where: { bookingId: booking.id, status: { in: ["paid", "ready_for_pickup"] } },
    include: { items: true },
  });

  const summary = {
    bookingCode: booking.bookingCode,
    touristName: booking.touristName,
    pax: booking.paxAdults + booking.paxChildren,
    visitDate: booking.visitDate,
    sites: booking.destinations.map((d) => d.destination.name),
    guides: booking.assignments.map((a) => a.guide.fullName),
    balance: booking.totalAmount - booking.amountPaid,
    productOrders: productOrders.map((o) => ({
      orderCode: o.orderCode,
      status: o.status,
      items: o.items.map((i) => `${i.qty} ${i.unit} ${i.name}`),
    })),
  };

  if (booking.status === "checked_in" || booking.status === "completed") {
    return NextResponse.json({
      ok: true,
      already: true,
      status: booking.status,
      scannedAt: booking.qrPass?.scannedAt ?? null,
      booking: summary,
    });
  }
  if (booking.status !== "approved") {
    return NextResponse.json(
      { error: `This booking is "${booking.status.replace(/_/g, " ")}" — only approved bookings can check in.`, booking: summary },
      { status: 409 },
    );
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { status: "checked_in" } }),
    prisma.qrPass.update({ where: { bookingId: booking.id }, data: { scannedAt: now, scannedById: staff.id } }),
    prisma.guideAssignment.updateMany({ where: { bookingId: booking.id }, data: { status: "completed" } }),
    prisma.bookingStatusLog.create({
      data: { bookingId: booking.id, fromStatus: "approved", toStatus: "checked_in", note: `Checked in at site by ${staff.fullName}` },
    }),
  ]);

  return NextResponse.json({ ok: true, already: false, status: "checked_in", scannedAt: now, booking: summary });
}
