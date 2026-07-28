import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasBookingAccess } from "@/lib/booking-access";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { dispatchQueuedSms } from "@/lib/sms";

/**
 * GCash manual-verification flow for a product order — mirrors
 * /api/bookings/[code]/pay exactly, but for the tourist's product purchase
 * rather than the tour reservation fee. Full payment is required (goods are
 * sourced in advance), so there's no partial/balance concept here.
 */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const ip = clientIpFrom(req);
  const limit = rateLimit(`product-pay:${ip}`, 10, 15 * 60 * 1000);
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

  const order = await prisma.productOrder.findUnique({ where: { orderCode: code }, include: { booking: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const entitled = await hasBookingAccess(order.booking.bookingCode);
  if (!entitled) return NextResponse.json({ error: "This browser isn't verified for that booking." }, { status: 401 });

  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "This order is no longer awaiting payment." }, { status: 409 });
  }
  if (order.expiresAt && order.expiresAt < new Date()) {
    await prisma.productOrder.update({ where: { id: order.id }, data: { status: "expired" } });
    return NextResponse.json({ error: "This order has expired." }, { status: 409 });
  }

  const duplicate = await prisma.productPayment.findFirst({ where: { gatewayRef: refNo, status: { in: ["pending", "paid"] } } });
  if (duplicate) {
    return NextResponse.json({ error: "This GCash reference number has already been submitted." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.productPayment.create({
      data: { orderId: order.id, method: "gcash", amount: order.totalAmount, gatewayRef: refNo, senderName, status: "pending" },
    }),
    prisma.productOrder.update({ where: { id: order.id }, data: { status: "payment_review" } }),
    prisma.productOrderStatusLog.create({
      data: { orderId: order.id, fromStatus: "pending_payment", toStatus: "payment_review", note: `GCash ref ${refNo} submitted by tourist` },
    }),
    prisma.smsLog.create({
      data: {
        bookingId: order.bookingId,
        recipientMobile: order.booking.touristMobile,
        recipientType: "tourist",
        template: "PRODUCT_PAYMENT_SUBMITTED",
        message: `Bagulin Tourism: We received your GCash reference for order ${code}. We'll confirm shortly — you'll get an SMS once verified.`,
      },
    }),
  ]);

  await dispatchQueuedSms(order.bookingId);
  return NextResponse.json({ ok: true, status: "payment_review" });
}
