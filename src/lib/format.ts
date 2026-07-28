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
