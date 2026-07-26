import { prisma } from "@/lib/prisma";
import { peso } from "@/lib/format";
import { TrendUpIcon, MapPinIcon, CoinsIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function AdminAnalytics() {
  const [bookings, payments, destPop, origins] = await Promise.all([
    prisma.booking.findMany({ select: { status: true, paxAdults: true, paxChildren: true, createdAt: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    prisma.bookingDestination.groupBy({ by: ["destinationId"], _count: { _all: true } }),
    prisma.booking.groupBy({ by: ["touristOrigin"], _count: { _all: true }, where: { touristOrigin: { not: null } } }),
  ]);

  const totalVisitors = bookings
    .filter((b) => ["approved", "checked_in", "completed"].includes(b.status))
    .reduce((s, b) => s + b.paxAdults + b.paxChildren, 0);
  const funnel = {
    submitted: bookings.length,
    paid: bookings.filter((b) => b.status !== "pending_payment" && b.status !== "expired").length,
    approved: bookings.filter((b) => ["approved", "checked_in", "completed"].includes(b.status)).length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const dests = await prisma.destination.findMany({ where: { id: { in: destPop.map((d) => d.destinationId) } } });
  const popularity = destPop
    .map((d) => ({ name: dests.find((x) => x.id === d.destinationId)?.name ?? "—", count: d._count._all }))
    .sort((a, b) => b.count - a.count);
  const maxPop = Math.max(1, ...popularity.map((p) => p.count));

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Tourism Analytics</h1>
      <p className="text-sm text-ink-600">Visitor statistics, revenue, and the booking funnel — the data your DOT/provincial arrival reports are built from.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Kpi icon={<UsersThreeIcon size={24} weight="duotone" />} label="Confirmed visitors" value={String(totalVisitors)} />
        <Kpi icon={<CoinsIcon size={24} weight="duotone" />} label="Total collected" value={peso(payments._sum.amount ?? 0)} />
        <Kpi icon={<TrendUpIcon size={24} weight="duotone" />} label="Bookings" value={String(bookings.length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Booking funnel</h2>
          <FunnelBar label="Submitted" value={funnel.submitted} max={funnel.submitted} />
          <FunnelBar label="Paid reservation" value={funnel.paid} max={funnel.submitted} />
          <FunnelBar label="Approved" value={funnel.approved} max={funnel.submitted} />
          <FunnelBar label="Completed" value={funnel.completed} max={funnel.submitted} />
        </section>

        <section className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Destination popularity</h2>
          {popularity.length === 0 ? (
            <p className="text-sm text-ink-600">No bookings yet.</p>
          ) : (
            popularity.map((p) => (
              <div key={p.name} className="mb-2">
                <div className="flex justify-between text-[13px]"><span className="flex items-center gap-1"><MapPinIcon size={12} />{p.name}</span><b>{p.count}</b></div>
                <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-brand-500" style={{ width: `${(p.count / maxPop) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="mt-6 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="mb-2 font-display text-lg font-bold">Visitor origins</h2>
        <p className="mb-2 text-xs text-ink-600">Captured at booking — feeds the one-click DOT / provincial tourist-arrival report.</p>
        {origins.length === 0 ? (
          <p className="text-sm text-ink-600">No origin data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {origins.map((o) => (
              <span key={o.touristOrigin} className="chip">{o.touristOrigin}: {o._count._all}</span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 rounded-card border border-brand-100 bg-brand-100/40 p-4 text-sm text-brand-700">
        <b>Forecasting (roadmap):</b> once ~6 months of bookings accumulate, this page adds peak-season prediction
        (Holy Week, summer, town fiesta) and weekly arrival forecasts to pre-schedule guides. Real ML lands in year 2.
      </div>
    </>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className="text-brand-700">{icon}</div>
      <div className="mt-1 font-display text-2xl font-extrabold">{value}</div>
      <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-600">{label}</div>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[13px]"><span>{label}</span><b>{value}</b></div>
      <div className="mt-0.5 h-3 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-cta-500" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
