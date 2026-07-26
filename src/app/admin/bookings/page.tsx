import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { peso, shortDate, statusMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "payment_review", label: "Verify payments" },
  { key: "pending_approval", label: "Pending approval" },
  { key: "approved", label: "Approved" },
  { key: "pending_payment", label: "Awaiting payment" },
  { key: "completed", label: "Completed" },
];

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const where = status && status !== "all" ? { status } : {};
  const bookings = await prisma.booking.findMany({
    where,
    include: { destinations: { include: { destination: true } }, tourPackage: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Bookings</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/bookings${f.key === "all" ? "" : `?status=${f.key}`}`}
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
              <th className="p-3">Code</th>
              <th className="p-3">Tourist</th>
              <th className="p-3">Visit date</th>
              <th className="p-3">Pax</th>
              <th className="p-3">Type</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-ink-600">No bookings found.</td></tr>
            )}
            {bookings.map((b) => {
              const meta = statusMeta(b.status);
              return (
                <tr key={b.id} className="border-t border-line hover:bg-brand-100/30">
                  <td className="p-3">
                    <Link href={`/admin/bookings/${b.bookingCode}`} className="font-display font-bold text-brand-700 hover:underline">{b.bookingCode}</Link>
                  </td>
                  <td className="p-3">{b.touristName}<div className="text-xs text-ink-600">{b.touristMobile}</div></td>
                  <td className="p-3">{shortDate(b.visitDate)}</td>
                  <td className="p-3">{b.paxAdults + b.paxChildren}</td>
                  <td className="p-3">{b.bookingType === "package" ? b.tourPackage?.name : "Custom"}</td>
                  <td className="p-3">{peso(b.totalAmount)}</td>
                  <td className="p-3"><span className={`pill ${meta.className}`}>{meta.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
