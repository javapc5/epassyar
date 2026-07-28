import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { peso, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "payment_review", label: "Verify payments" },
  { key: "paid", label: "Paid — preparing" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "pending_payment", label: "Awaiting payment" },
  { key: "picked_up", label: "Picked up" },
];

const STATUS_CLASS: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_review: "bg-amber-100 text-amber-800",
  paid: "bg-brand-100 text-brand-700",
  ready_for_pickup: "bg-ok/15 text-ok",
  picked_up: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
};

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const where = status && status !== "all" ? { status } : {};
  const orders = await prisma.productOrder.findMany({
    where,
    include: { booking: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Product Orders</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/orders${f.key === "all" ? "" : `?status=${f.key}`}`}
            className={`pill border ${(status ?? "all") === f.key ? "border-brand-700 bg-brand-100 text-brand-700" : "border-line bg-white text-ink-600"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Booking</th>
              <th className="p-3">Tourist</th>
              <th className="p-3">Pickup date</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-ink-600">No product orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.orderCode}`} className="font-display font-bold text-brand-700 hover:underline">{o.orderCode}</Link>
                </td>
                <td className="p-3">
                  <Link href={`/admin/bookings/${o.booking.bookingCode}`} className="text-ink-700 hover:underline">{o.booking.bookingCode}</Link>
                </td>
                <td className="p-3">{o.booking.touristName}<div className="text-xs text-ink-600">{o.booking.touristMobile}</div></td>
                <td className="p-3">{shortDate(o.pickupDate)}</td>
                <td className="p-3">{o.items.length} item{o.items.length > 1 ? "s" : ""}</td>
                <td className="p-3">{peso(o.totalAmount)}</td>
                <td className="p-3"><span className={`pill ${STATUS_CLASS[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status.replace(/_/g, " ")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
