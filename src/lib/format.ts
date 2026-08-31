/** True for public /uploads/ paths, gated /api/admin/media/ paths, and https:// URLs. */
export function isMediaUrl(url: string | null | undefined): boolean {
  return (
    !!url &&
    (url.startsWith("/uploads/") ||
      url.startsWith("/api/admin/media/") ||
      url.startsWith("https://"))
  );
}

export function peso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function shortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** "₱180 / kilo" style price label for a local product. */
export function unitPrice(price: number, unit: string): string {
  return `${peso(price)} / ${unit}`;
}

type ProductLike = {
  status: string;
  availabilityMode: string;
  stockQty: number;
  leadTimeDays: number;
};

export type AvailabilityMode = "always" | "in_stock" | "made_to_order" | "unavailable";

/**
 * Availability for a local product, optionally judged against a pickup date.
 *
 * The supply model is an explicit `availabilityMode` the admin sets, not
 * inferred from the numbers:
 *   - always        → office always has it; buyable regardless of stock/date
 *   - in_stock      → real on-hand units in stockQty
 *   - made_to_order → sourced from the farmer; buyable only if the pickup date
 *                     is far enough out to clear leadTimeDays
 *   - unavailable   → temporarily off
 *
 * `status` is the hard on/off (an archived/hidden product) and always wins.
 * Returns a tone the UI maps to a colour.
 */
export function productAvailability(
  p: ProductLike,
  pickupDate?: Date | string | null,
): { ok: boolean; label: string; tone: "ok" | "warn" | "off" } {
  if (p.status !== "available") return { ok: false, label: "Currently unavailable", tone: "off" };

  switch (p.availabilityMode) {
    case "unavailable":
      return { ok: false, label: "Currently unavailable", tone: "off" };

    case "always":
      return { ok: true, label: "Available anytime", tone: "ok" };

    case "made_to_order": {
      if (!pickupDate) return { ok: true, label: `Made to order · ${p.leadTimeDays}-day notice`, tone: "warn" };
      const days = Math.ceil((new Date(pickupDate).getTime() - Date.now()) / 86_400_000);
      return days >= p.leadTimeDays
        ? { ok: true, label: "Made to order — ready for your visit", tone: "ok" }
        : { ok: false, label: `Needs ${p.leadTimeDays}-day notice — too late`, tone: "off" };
    }

    case "in_stock":
    default:
      if (p.stockQty <= 0) return { ok: false, label: "Out of stock", tone: "off" };
      if (p.stockQty <= 5) return { ok: true, label: `Only ${p.stockQty} left`, tone: "warn" };
      return { ok: true, label: "In stock", tone: "ok" };
  }
}

export function isoDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

// JSON-string array fields (SQLite compatibility) -> string[]
export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// bookingCode() lives in src/lib/booking-code.ts — it needs node:crypto, and
// this module is imported by client components.

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" },
  payment_review: { label: "Payment under review", className: "bg-amber-100 text-amber-800" },
  pending_approval: { label: "Pending approval", className: "bg-river-100 text-river-500" },
  approved: { label: "Approved", className: "bg-brand-100 text-brand-700" },
  checked_in: { label: "Checked in", className: "bg-brand-100 text-brand-700" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500" },
};

export function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
}
