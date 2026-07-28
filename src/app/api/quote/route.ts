import { NextResponse } from "next/server";
import { quoteCustomItinerary } from "@/lib/pricing";
import { remainingCapacity } from "@/lib/availability";
import { rateLimit, clientIpFrom } from "@/lib/rate-limit";

const MAX_DESTINATIONS = 12;

export async function POST(req: Request) {
  // Fires on every edit in the itinerary builder, so the ceiling is generous —
  // it exists to stop the endpoint being used as a database amplifier.
  const ip = clientIpFrom(req);
  const limit = rateLimit(`quote:${ip}`, 120, 5 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const destinationIds: number[] = [
    ...new Set((body.destinationIds ?? []).map(Number).filter((n: number) => Number.isInteger(n) && n > 0)),
  ] as number[];
  const adults = Math.max(1, Math.min(100, Math.floor(Number(body.adults ?? 1)) || 1));
  const children = Math.max(0, Math.min(100, Math.floor(Number(body.children ?? 0)) || 0));
  const transportRouteId = body.transportRouteId ? Number(body.transportRouteId) : null;
  const parsedDate = body.visitDate ? new Date(body.visitDate) : new Date();
  const visitDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  if (destinationIds.length === 0) {
    return NextResponse.json({ error: "Add at least one destination." }, { status: 400 });
  }
  if (destinationIds.length > MAX_DESTINATIONS) {
    return NextResponse.json({ error: `An itinerary can include up to ${MAX_DESTINATIONS} destinations.` }, { status: 400 });
  }

  const quote = await quoteCustomItinerary({
    municipalityId: 1,
    destinationIds,
    adults,
    children,
    transportRouteId,
  });

  // capacity check per destination for the chosen date
  const pax = adults + children;
  const capacity = await Promise.all(
    destinationIds.map(async (id) => {
      const remaining = await remainingCapacity(id, visitDate);
      return { id, remaining, enough: remaining >= pax };
    }),
  );

  return NextResponse.json({ quote, capacity });
}
