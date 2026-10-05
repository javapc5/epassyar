import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { dispatchQueuedSms } from "@/lib/sms";

/**
 * GCash manual-verification flow: the tourist sends the reservation fee to the
 * GCash account in their GCash app, then submits the 13-digit reference
 * number here. The payment is recorded as *pending* and the booking moves to
 * `payment_review` — staff verify the reference against their
 * GCash transaction history and confirm in the admin panel.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Submitting a reference flips the booking to payment_review and texts the
  // tourist, so cap how often one connection can do it.
  const ip = clientIpFrom(req);
  const limit = rateLimit(`pay:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const refNo = String(body.refNo ?? "").replace(/\s+/g, "");
  const senderName = String(body.senderName ?? "").trim().slice(0, 120);

  if (!/^\d{9,13}$/.test(refNo)) {
    return NextResponse.json({ error: "Please enter the GCash reference number (9–13 digits, on your receipt)." }, { status: 400 });
  }
  if (!senderName) {
    return NextResponse.json({ error: "Please enter the name on the GCash account you paid from." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { bookingCode: code } });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "This booking is no longer awaiting payment." }, { status: 409 });
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "expired" } });
    return NextResponse.json({ error: "This reservation has expired." }, { status: 409 });
  }

  const duplicate = await prisma.payment.findFirst({ where: { gatewayRef: refNo, status: { in: ["pending", "paid"] } } });
  if (duplicate) {
    return NextResponse.json({ error: "This GCash reference number has already been submitted." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        paymentKind: "reservation",
        method: "gcash",
        amount: booking.reservationDue,
        gatewayRef: refNo,
        senderName,
        status: "pending",
      },
    }),
    prisma.booking.update({ where: { id: booking.id }, data: { status: "payment_review" } }),
    prisma.bookingStatusLog.create({
      data: { bookingId: booking.id, fromStatus: "pending_payment", toStatus: "payment_review", note: `GCash ref ${refNo} submitted by tourist` },
    }),
    prisma.smsLog.create({
      data: {
        bookingId: booking.id,
        recipientMobile: booking.touristMobile,
        recipientType: "tourist",
        template: "PAYMENT_SUBMITTED",
        message: `ePassyar: We received your GCash reference for ${code}. We'll confirm your payment shortly — you'll get an SMS once verified.`,
      },
    }),
  ]);

  await dispatchQueuedSms(booking.id);
  return NextResponse.json({ ok: true, status: "payment_review" });
}
