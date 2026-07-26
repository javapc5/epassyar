import { NextResponse } from "next/server";
import { quoteCustomItinerary } from "@/lib/pricing";
import { remainingCapacity } from "@/lib/availability";

export async function POST(req: Request) {
  const body = await req.json();
  const destinationIds: number[] = (body.destinationIds ?? []).map(Number);
  const adults = Math.max(1, Number(body.adults ?? 1));
  const children = Math.max(0, Number(body.children ?? 0));
  const transportRouteId = body.transportRouteId ? Number(body.transportRouteId) : null;
  const visitDate = body.visitDate ? new Date(body.visitDate) : new Date();

  if (destinationIds.length === 0) {
    return NextResponse.json({ error: "Add at least one destination." }, { status: 400 });
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
    destinationIds.map(async (id) => ({
      id,
      remaining: await remainingCapacity(id, visitDate),
      enough: (await remainingCapacity(id, visitDate)) >= pax,
    })),
  );

  return NextResponse.json({ quote, capacity });
}
