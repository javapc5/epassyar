import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasBookingAccess } from "@/lib/booking-access";
import { productOrderCode } from "@/lib/product-order-code";
import { productAvailability } from "@/lib/format";
import { productStockRemaining } from "@/lib/availability";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";
import { dispatchQueuedSms } from "@/lib/sms";

const MAX_LINES = 20;

/**
 * Turns the tourist's client-side cart into a real order tied to their
 * booking. The cart is a UI convenience only — nothing here trusts the price,
 * name, or unit the client sent; every line is re-derived from the database.
 *
 * Gate is the booking-access cookie (same one that opens /booking/[code]),
 * NOT booking-approval status — buying products is unrelated to whether a
 * guide has been assigned yet. `/products` browsing stays public; this is the
 * one endpoint that's actually gated.
 */
export async function POST(req: Request) {
  const ip = clientIpFrom(req);
  const limit = rateLimit(`checkout:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const bookingCode = String(body.bookingCode ?? "").trim().toUpperCase();
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!bookingCode) return NextResponse.json({ error: "Missing booking reference." }, { status: 400 });
  if (rawItems.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (rawItems.length > MAX_LINES) {
    return NextResponse.json({ error: `A checkout can include up to ${MAX_LINES} products.` }, { status: 400 });
  }

  const entitled = await hasBookingAccess(bookingCode);
  if (!entitled) return NextResponse.json({ error: "This browser isn't verified for that booking." }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { bookingCode } });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (["cancelled", "expired", "completed"].includes(booking.status)) {
    return NextResponse.json({ error: "This booking can no longer take new orders." }, { status: 409 });
  }

  // De-duplicate product ids and clamp quantities.
  const wanted = new Map<number, number>();
  for (const line of rawItems) {
    const productId = Number(line?.productId);
    const qty = Math.floor(Number(line?.qty));
    if (!Number.isInteger(productId) || productId <= 0) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    wanted.set(productId, (wanted.get(productId) ?? 0) + Math.min(qty, 999));
  }
  if (wanted.size === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const products = await prisma.localProduct.findMany({ where: { id: { in: [...wanted.keys()] } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const orderItems: { productId: number; name: string; unit: string; unitPrice: number; qty: number; lineTotal: number }[] = [];
  for (const [productId, qty] of wanted) {
    const product = byId.get(productId);
    if (!product || product.status !== "available") {
      return NextResponse.json({ error: `One of the items in your cart is no longer available.` }, { status: 409 });
    }

    const avail = productAvailability(product, booking.visitDate);
    if (!avail.ok) {
      return NextResponse.json({ error: `${product.name}: ${avail.label.toLowerCase()}.` }, { status: 409 });
    }
    if (product.availabilityMode === "in_stock") {
      const remaining = await productStockRemaining(product.id);
      if (remaining < qty) {
        return NextResponse.json({ error: `${product.name} only has ${remaining} left in stock.` }, { status: 409 });
      }
    }

    const lineTotal = Math.round(product.price * qty * 100) / 100;
    orderItems.push({ productId, name: product.name, unit: product.unit, unitPrice: product.price, qty, lineTotal });
  }

  const totalAmount = Math.round(orderItems.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
  const muni = await prisma.municipality.findUnique({ where: { id: booking.municipalityId } });
  const expiresAt = new Date(Date.now() + (muni?.reservationExpiryHours ?? 24) * 3600 * 1000);
  const orderCode = await productOrderCode(bookingCode);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.productOrder.create({
      data: {
        orderCode,
        bookingId: booking.id,
        municipalityId: booking.municipalityId,
        pickupDate: booking.visitDate,
        totalAmount,
        status: "pending_payment",
        expiresAt,
        items: { create: orderItems },
        statusLogs: { create: { toStatus: "pending_payment", note: "Order placed from cart" } },
      },
    });
    return created;
  });

  await prisma.smsLog.create({
    data: {
      bookingId: booking.id,
      recipientMobile: booking.touristMobile,
      recipientType: "tourist",
      template: "PRODUCT_ORDER_CREATED",
      message: `ePassyar: Product order ${orderCode} placed. Pay ${totalAmount} in full to confirm — see your booking page.`,
    },
  });
  await dispatchQueuedSms(booking.id);

  return NextResponse.json({ orderCode: order.orderCode, totalAmount: order.totalAmount });
}
