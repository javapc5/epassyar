import { prisma } from "./prisma";

const HOLDING_STATUSES = ["pending_payment", "pending_approval", "approved", "checked_in"];

/**
 * Remaining capacity for a destination on a date. Unpaid (pending_payment)
 * bookings only hold their slots until they expire — expired ones are ignored.
 */
export async function remainingCapacity(destinationId: number, date: Date): Promise<number> {
  const dest = await prisma.destination.findUnique({ where: { id: destinationId } });
  if (!dest) return 0;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const items = await prisma.bookingDestination.findMany({
    where: {
      destinationId,
      visitDate: { gte: dayStart, lt: dayEnd },
      booking: { status: { in: HOLDING_STATUSES } },
    },
    include: { booking: true },
  });

  const now = new Date();
  const used = items.reduce((sum, item) => {
    const b = item.booking;
    // ignore unpaid holds that have already expired
    if (b.status === "pending_payment" && b.expiresAt && b.expiresAt < now) return sum;
    return sum + b.paxAdults + b.paxChildren;
  }, 0);

  return Math.max(0, dest.dailyCapacity - used);
}

/**
 * Rank available guides for a booking's itinerary on a duty date.
 * Order: availability -> barangay proximity -> specialty match -> fair rotation -> rating.
 * Returns the top suggestions; the admin still confirms (assignment stays human-approved).
 */
export async function suggestGuides(
  municipalityId: number,
  destinationBarangays: string[],
  dutyDate: Date,
  needsAdventure: boolean,
) {
  const dayStart = new Date(dutyDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const guides = await prisma.tourGuide.findMany({
    where: { municipalityId, status: "active" },
    include: {
      assignments: true,
      availability: { where: { date: { gte: dayStart, lt: dayEnd } } },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const scored = guides
    .filter((g) => {
      const busy = g.assignments.some(
        (a) => a.dutyDate >= dayStart && a.dutyDate < dayEnd && a.status !== "declined",
      );
      const markedOff = g.availability.some((av) => av.status === "unavailable");
      return !busy && !markedOff;
    })
    .map((g) => {
      const specialties: string[] = safeParse(g.specialties);
      let score = 0;
      if (destinationBarangays.includes(g.barangay)) score += 40; // proximity
      if (needsAdventure && specialties.some((s) => /rappel|adventure/i.test(s))) score += 30;
      const recent = g.assignments.filter((a) => a.dutyDate >= thirtyDaysAgo).length;
      score += Math.max(0, 20 - recent * 4); // fair rotation
      score += g.ratingAvg * 2; // tiebreaker
      return { guide: g, score, recentDuties: recent };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}

function safeParse(v: string): string[] {
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

/**
 * Remaining sellable stock for an `in_stock`-mode product. `stockQty` is the
 * admin's on-hand count and is never touched by checkout — it's only mutated
 * by an admin edit or by the "mark picked up" fulfillment step, which is the
 * moment goods actually leave the shelf. Everything in between (pending
 * payment, under review, paid, ready for pickup) counts as a live hold, same
 * as `remainingCapacity()` above; an expired unpaid order releases its hold
 * automatically because nothing was ever decremented for it.
 */
export async function productStockRemaining(productId: number): Promise<number> {
  const product = await prisma.localProduct.findUnique({ where: { id: productId } });
  if (!product || product.availabilityMode !== "in_stock") return Infinity;

  const items = await prisma.productOrderItem.findMany({
    where: { productId },
    include: { order: true },
  });

  const now = new Date();
  const held = items.reduce((sum, item) => {
    const o = item.order;
    // Already reflected directly in stockQty by the pickup transaction — counting
    // it again here would double-subtract every order once it's fulfilled.
    if (o.status === "picked_up") return sum;
    if (o.status === "cancelled") return sum;
    if (o.status === "pending_payment" && o.expiresAt && o.expiresAt < now) return sum; // expired hold — released
    return sum + item.qty;
  }, 0);

  return Math.max(0, product.stockQty - held);
}
