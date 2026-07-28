/** Returns true for both local /uploads/ paths and Cloudinary https:// URLs. */
export function isMediaUrl(url: string | null | undefined): boolean {
  return !!url && (url.startsWith("/uploads/") || url.startsWith("https://"));
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
  stockQty: number;
  leadTimeDays: number;
};

/**
 * Availability for a local product, optionally judged against a pickup date.
 *
 * Two supply models share one field set: shelf stock (leadTimeDays 0 — stockQty
 * is a real on-hand count) and harvest / made-to-order (leadTimeDays > 0 — the
 * item is sourced from the farmer, so it is "available" only if the pickup date
 * is far enough out to harvest it). Returns a tone the UI maps to a colour.
 */
export function productAvailability(
  p: ProductLike,
  pickupDate?: Date | string | null,
): { ok: boolean; label: string; tone: "ok" | "warn" | "off" } {
  if (p.status !== "available") return { ok: false, label: "Currently unavailable", tone: "off" };

  if (p.leadTimeDays > 0) {
    if (!pickupDate) return { ok: true, label: `Made to order · ${p.leadTimeDays}-day notice`, tone: "warn" };
    const days = Math.ceil((new Date(pickupDate).getTime() - Date.now()) / 86_400_000);
    return days >= p.leadTimeDays
      ? { ok: true, label: "Can be ready for your visit", tone: "ok" }
      : { ok: false, label: `Needs ${p.leadTimeDays}-day notice`, tone: "off" };
  }

  if (p.stockQty <= 0) return { ok: false, label: "Out of stock", tone: "off" };
  if (p.stockQty <= 5) return { ok: true, label: `Only ${p.stockQty} left`, tone: "warn" };
  return { ok: true, label: "In stock", tone: "ok" };
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
