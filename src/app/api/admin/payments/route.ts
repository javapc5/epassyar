import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchQueuedSms } from "@/lib/sms";

/**
 * Admin payment actions:
 * - { action: "verify",  paymentId }            → confirm a pending GCash payment
 * - { action: "reject",  paymentId }            → reject it (booking returns to pending_payment)
 * - { action: "treasurer", bookingCode, orNumber } → record a cash payment at the Treasurer's Office
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "verify" || action === "reject") {
    const payment = await prisma.payment.findUnique({ where: { id: Number(body.paymentId) }, include: { booking: true } });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (payment.status !== "pending") return NextResponse.json({ error: "This payment is not pending." }, { status: 409 });
    const b = payment.booking;

    if (action === "verify") {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "paid", paidAt: new Date() } }),
        prisma.booking.update({
          where: { id: b.id },
          data: { amountPaid: b.amountPaid + payment.amount, status: "pending_approval" },
        }),
        prisma.bookingStatusLog.create({
          data: { bookingId: b.id, fromStatus: b.status, toStatus: "pending_approval", note: `GCash payment verified (ref ${payment.gatewayRef})` },
        }),
        prisma.smsLog.create({
          data: {
            bookingId: b.id, recipientMobile: b.touristMobile, recipientType: "tourist", template: "PAYMENT_VERIFIED",
            message: `Bagulin Tourism: Payment confirmed for ${b.bookingCode}! Your booking is now awaiting Tourism Office approval.`,
          },
        }),
      ]);
      await dispatchQueuedSms(b.id);
      return NextResponse.json({ ok: true, status: "pending_approval" });
    }

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } }),
      prisma.booking.update({ where: { id: b.id }, data: { status: "pending_payment" } }),
      prisma.bookingStatusLog.create({
        data: { bookingId: b.id, fromStatus: b.status, toStatus: "pending_payment", note: `GCash ref ${payment.gatewayRef} could not be verified — tourist asked to re-check` },
      }),
      prisma.smsLog.create({
        data: {
          bookingId: b.id, recipientMobile: b.touristMobile, recipientType: "tourist", template: "PAYMENT_REJECTED",
          message: `Bagulin Tourism: We couldn't verify the GCash reference for ${b.bookingCode}. Please check the number and submit again, or contact the Tourism Office.`,
        },
      }),
    ]);
    await dispatchQueuedSms(b.id);
    return NextResponse.json({ ok: true, status: "pending_payment" });
  }

  if (action === "treasurer") {
    const booking = await prisma.booking.findUnique({ where: { bookingCode: String(body.bookingCode ?? "") } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.status !== "pending_payment" && booking.status !== "payment_review") {
      return NextResponse.json({ error: "This booking is not awaiting payment." }, { status: 409 });
    }
    const orNumber = String(body.orNumber ?? "").trim();
    if (!orNumber) return NextResponse.json({ error: "Official receipt number is required." }, { status: 400 });

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: booking.id, paymentKind: "reservation", method: "treasurer_cash",
          amount: booking.reservationDue, orNumber, status: "paid", paidAt: new Date(),
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { amountPaid: booking.amountPaid + booking.reservationDue, status: "pending_approval" },
      }),
      prisma.bookingStatusLog.create({
        data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "pending_approval", note: `Cash payment recorded at Treasurer's Office (OR ${orNumber})` },
      }),
      prisma.smsLog.create({
        data: {
          bookingId: booking.id, recipientMobile: booking.touristMobile, recipientType: "tourist", template: "PAYMENT_VERIFIED",
          message: `Bagulin Tourism: Payment received (OR ${orNumber}) for ${booking.bookingCode}. Awaiting Tourism Office approval.`,
        },
      }),
    ]);
    await dispatchQueuedSms(booking.id);
    return NextResponse.json({ ok: true, status: "pending_approval" });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
