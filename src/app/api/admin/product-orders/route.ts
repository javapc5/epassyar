import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { dispatchQueuedSms } from "@/lib/sms";

/**
 * Admin actions on product orders:
 * - { action: "verify",  paymentId }              → confirm a pending GCash payment
 * - { action: "reject",  paymentId }              → reject it (order returns to pending_payment)
 * - { action: "treasurer", orderCode, orNumber }  → record a cash payment
 * - { action: "mark_ready", orderCode }           → paid -> ready_for_pickup
 * - { action: "mark_picked_up", orderCode }       → hand over goods; decrements stock for in_stock items
 * - { action: "cancel", orderCode }               → cancel before pickup (no automated refund)
 */
export async function POST(req: Request) {
  const staff = await getSessionUser();
  if (!staff) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "verify" || action === "reject") {
    const payment = await prisma.productPayment.findUnique({ where: { id: Number(body.paymentId) }, include: { order: { include: { booking: true } } } });
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (payment.status !== "pending") return NextResponse.json({ error: "This payment is not pending." }, { status: 409 });
    const o = payment.order;

    if (action === "verify") {
      await prisma.$transaction([
        prisma.productPayment.update({ where: { id: payment.id }, data: { status: "paid", paidAt: new Date() } }),
        prisma.productOrder.update({ where: { id: o.id }, data: { amountPaid: o.amountPaid + payment.amount, status: "paid" } }),
        prisma.productOrderStatusLog.create({
          data: { orderId: o.id, fromStatus: o.status, toStatus: "paid", note: `GCash payment verified by ${staff.fullName} (ref ${payment.gatewayRef})` },
        }),
        prisma.smsLog.create({
          data: {
            bookingId: o.bookingId, recipientMobile: o.booking.touristMobile, recipientType: "tourist", template: "PRODUCT_PAYMENT_VERIFIED",
            message: `Bagulin Tourism: Payment confirmed for order ${o.orderCode}! We'll text you again once it's ready for pickup.`,
          },
        }),
      ]);
      await dispatchQueuedSms(o.bookingId);
      return NextResponse.json({ ok: true, status: "paid" });
    }

    await prisma.$transaction([
      prisma.productPayment.update({ where: { id: payment.id }, data: { status: "failed" } }),
      prisma.productOrder.update({ where: { id: o.id }, data: { status: "pending_payment" } }),
      prisma.productOrderStatusLog.create({
        data: { orderId: o.id, fromStatus: o.status, toStatus: "pending_payment", note: `GCash ref ${payment.gatewayRef} could not be verified by ${staff.fullName} — tourist asked to re-check` },
      }),
      prisma.smsLog.create({
        data: {
          bookingId: o.bookingId, recipientMobile: o.booking.touristMobile, recipientType: "tourist", template: "PRODUCT_PAYMENT_REJECTED",
          message: `Bagulin Tourism: We couldn't verify the GCash reference for order ${o.orderCode}. Please check and submit again, or contact the Tourism Office.`,
        },
      }),
    ]);
    await dispatchQueuedSms(o.bookingId);
    return NextResponse.json({ ok: true, status: "pending_payment" });
  }

  if (action === "treasurer") {
    const order = await prisma.productOrder.findUnique({ where: { orderCode: String(body.orderCode ?? "") }, include: { booking: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "pending_payment" && order.status !== "payment_review") {
      return NextResponse.json({ error: "This order is not awaiting payment." }, { status: 409 });
    }
    const orNumber = String(body.orNumber ?? "").trim();
    if (!orNumber) return NextResponse.json({ error: "Official receipt number is required." }, { status: 400 });

    await prisma.$transaction([
      prisma.productPayment.create({
        data: { orderId: order.id, method: "treasurer_cash", amount: order.totalAmount, orNumber, status: "paid", paidAt: new Date() },
      }),
      prisma.productOrder.update({ where: { id: order.id }, data: { amountPaid: order.amountPaid + order.totalAmount, status: "paid" } }),
      prisma.productOrderStatusLog.create({
        data: { orderId: order.id, fromStatus: order.status, toStatus: "paid", note: `Cash payment recorded at Treasurer's Office by ${staff.fullName} (OR ${orNumber})` },
      }),
      prisma.smsLog.create({
        data: {
          bookingId: order.bookingId, recipientMobile: order.booking.touristMobile, recipientType: "tourist", template: "PRODUCT_PAYMENT_VERIFIED",
          message: `Bagulin Tourism: Payment received (OR ${orNumber}) for order ${order.orderCode}. We'll text you once it's ready for pickup.`,
        },
      }),
    ]);
    await dispatchQueuedSms(order.bookingId);
    return NextResponse.json({ ok: true, status: "paid" });
  }

  if (action === "mark_ready") {
    const order = await prisma.productOrder.findUnique({ where: { orderCode: String(body.orderCode ?? "") }, include: { booking: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status !== "paid") return NextResponse.json({ error: "Only a paid order can be marked ready." }, { status: 409 });

    await prisma.$transaction([
      prisma.productOrder.update({ where: { id: order.id }, data: { status: "ready_for_pickup" } }),
      prisma.productOrderStatusLog.create({
        data: { orderId: order.id, fromStatus: "paid", toStatus: "ready_for_pickup", note: `Marked ready for pickup by ${staff.fullName}` },
      }),
      prisma.smsLog.create({
        data: {
          bookingId: order.bookingId, recipientMobile: order.booking.touristMobile, recipientType: "tourist", template: "PRODUCT_ORDER_READY",
          message: `Bagulin Tourism: Order ${order.orderCode} is ready for pickup at the Municipal Tourism Office on your visit day.`,
        },
      }),
    ]);
    await dispatchQueuedSms(order.bookingId);
    return NextResponse.json({ ok: true, status: "ready_for_pickup" });
  }

  if (action === "mark_picked_up") {
    const order = await prisma.productOrder.findUnique({
      where: { orderCode: String(body.orderCode ?? "") },
      include: { items: { include: { product: true } } },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!["paid", "ready_for_pickup"].includes(order.status)) {
      return NextResponse.json({ error: "This order isn't ready to be handed over." }, { status: 409 });
    }

    const ops = [
      prisma.productOrder.update({ where: { id: order.id }, data: { status: "picked_up" } }),
      prisma.productOrderStatusLog.create({
        data: { orderId: order.id, fromStatus: order.status, toStatus: "picked_up", note: `Handed over by ${staff.fullName}` },
      }),
      // Goods physically leave the shelf now — this is the one place stockQty moves.
      ...order.items
        .filter((item) => item.product.availabilityMode === "in_stock")
        .map((item) => prisma.localProduct.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.qty } } })),
    ];
    await prisma.$transaction(ops);
    return NextResponse.json({ ok: true, status: "picked_up" });
  }

  if (action === "cancel") {
    const order = await prisma.productOrder.findUnique({ where: { orderCode: String(body.orderCode ?? "") } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (["picked_up", "cancelled"].includes(order.status)) {
      return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.productOrder.update({ where: { id: order.id }, data: { status: "cancelled" } }),
      prisma.productOrderStatusLog.create({
        data: { orderId: order.id, fromStatus: order.status, toStatus: "cancelled", note: `Cancelled by ${staff.fullName}` },
      }),
    ]);
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
