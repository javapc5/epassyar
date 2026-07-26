import { prisma } from "./prisma";

export type FeeLine = {
  feeCode: string;
  label: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
};

export type Quote = {
  lines: FeeLine[];
  total: number;
  reservationDue: number;
  balance: number;
  guidesNeeded: number;
  guideRequired: boolean;
  pax: number;
};

export type CustomQuoteInput = {
  municipalityId: number;
  destinationIds: number[];
  adults: number;
  children: number;
  durationDays?: number;
  transportRouteId?: number | null;
};

/**
 * Server-side pricing for a custom itinerary. The client never sends prices —
 * every peso is computed here from the database, so the tourist's breakdown,
 * the admin view, and the treasurer's report always agree.
 */
export async function quoteCustomItinerary(input: CustomQuoteInput): Promise<Quote> {
  const pax = Math.max(1, input.adults + input.children);
  const days = Math.max(1, input.durationDays ?? 1);

  const [destinations, feeSettings, transport] = await Promise.all([
    prisma.destination.findMany({ where: { id: { in: input.destinationIds } } }),
    prisma.feeSetting.findMany({ where: { municipalityId: input.municipalityId, isActive: true } }),
    input.transportRouteId
      ? prisma.transportRoute.findUnique({ where: { id: input.transportRouteId } })
      : Promise.resolve(null),
  ]);

  const envSetting = feeSettings.find((f) => f.feeCode === "ENVIRONMENTAL");
  const insSetting = feeSettings.find((f) => f.feeCode === "INSURANCE");
  const resSetting = feeSettings.find((f) => f.feeCode === "RESERVATION");

  const lines: FeeLine[] = [];

  // Entrance fees — per destination × pax
  const entranceTotal = destinations.reduce((sum, d) => sum + d.entranceFee * pax, 0);
  if (entranceTotal > 0) {
    lines.push({
      feeCode: "ENTRANCE",
      label: `Entrance fees (${destinations.length} site${destinations.length > 1 ? "s" : ""} × ${pax} pax)`,
      quantity: pax,
      unitAmount: destinations.reduce((s, d) => s + d.entranceFee, 0),
      lineTotal: round(entranceTotal),
    });
  }

  // Environmental fee — destination override, else municipal default × pax
  const envUnit =
    destinations.reduce((s, d) => s + (d.environmentalFee > 0 ? d.environmentalFee : envSetting?.amount ?? 0), 0);
  const envTotal = envUnit * pax;
  if (envTotal > 0) {
    lines.push({
      feeCode: "ENVIRONMENTAL",
      label: `Environmental fee (${destinations.length} × ${pax} pax)`,
      quantity: pax,
      unitAmount: envUnit,
      lineTotal: round(envTotal),
    });
  }

  // Guide fee — only if any destination requires a guide.
  const guideRequired = destinations.some((d) => d.guideRequired);
  const maxGroup = 10; // one guide per this many pax (matches TourGuide.maxGroupSize default)
  const guideDailyRate = 600;
  const guidesNeeded = guideRequired ? Math.ceil(pax / maxGroup) : 0;
  const guideTotal = guidesNeeded * guideDailyRate * days;
  if (guideTotal > 0) {
    lines.push({
      feeCode: "GUIDE",
      label: `Tour guide (${guidesNeeded} guide${guidesNeeded > 1 ? "s" : ""} × ${days} day${days > 1 ? "s" : ""})`,
      quantity: guidesNeeded * days,
      unitAmount: guideDailyRate,
      lineTotal: round(guideTotal),
    });
  }

  // Transport (optional)
  if (transport) {
    let transportTotal = 0;
    let label = "";
    if (transport.feePerPax) {
      transportTotal = transport.feePerPax * pax;
      label = `Transport — ${transport.vehicleType} (${transport.feePerPax} × ${pax})`;
    } else if (transport.feePerTrip) {
      const trips = Math.ceil(pax / (transport.maxPaxPerTrip ?? pax));
      transportTotal = transport.feePerTrip * trips;
      label = `Transport — ${transport.vehicleType} (${trips} trip${trips > 1 ? "s" : ""})`;
    }
    if (transportTotal > 0) {
      lines.push({
        feeCode: "TRANSPORT",
        label,
        quantity: pax,
        unitAmount: transport.feePerPax ?? transport.feePerTrip ?? 0,
        lineTotal: round(transportTotal),
      });
    }
  }

  // Insurance — per pax per day
  const insUnit = insSetting?.amount ?? 0;
  const insTotal = insUnit * pax * days;
  if (insTotal > 0) {
    lines.push({
      feeCode: "INSURANCE",
      label: `Tourist insurance (${insUnit} × ${pax}${days > 1 ? ` × ${days} days` : ""})`,
      quantity: pax * days,
      unitAmount: insUnit,
      lineTotal: round(insTotal),
    });
  }

  const total = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const reservationDue = computeReservationDue(total, resSetting?.calcType, resSetting?.amount);

  return {
    lines,
    total,
    reservationDue,
    balance: round(total - reservationDue),
    guidesNeeded,
    guideRequired,
    pax,
  };
}

export function computeReservationDue(total: number, calcType?: string, amount?: number): number {
  if (!amount) return round(total * 0.2);
  if (calcType === "percent_of_total") return round(total * (amount / 100));
  return round(Math.min(amount, total));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
