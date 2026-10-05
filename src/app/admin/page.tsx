import Link from "next/link";
import {
  UsersThreeIcon,
  ClockCountdownIcon,
  CoinsIcon,
  PersonSimpleHikeIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function dayRange(offset = 0) {
  const start = new Date();
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export default async function AdminDashboard() {
  const { start: todayStart, end: todayEnd } = dayRange(0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const paymentReviews = await prisma.booking.count({ where: { status: "payment_review" } });
  const [arrivalsToday, pendingApprovals, revenueAgg, dutyToday, queue, destinations] = await Promise.all([
    prisma.booking.aggregate({
      _sum: { paxAdults: true, paxChildren: true },
      where: { visitDate: { gte: todayStart, lt: todayEnd }, status: { in: ["approved", "checked_in", "completed"] } },
    }),
    prisma.booking.count({ where: { status: "pending_approval" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid", paidAt: { gte: monthStart } } }),
    prisma.guideAssignment.findMany({
      where: { dutyDate: { gte: todayStart, lt: todayEnd } },
      include: { guide: true, booking: { include: { destinations: { include: { destination: true } } } } },
    }),
    prisma.booking.findMany({
      where: { status: "pending_approval" },
      include: { destinations: { include: { destination: true } }, tourPackage: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    prisma.destination.findMany({ where: { status: "active" }, orderBy: { id: "asc" } }),
  ]);

  const arrivals = (arrivalsToday._sum.paxAdults ?? 0) + (arrivalsToday._sum.paxChildren ?? 0);
  const totalGuides = await prisma.tourGuide.count({ where: { status: "active" } });

  // Capacity heatmap: next 10 days for the top capacity-sensitive sites
  const heatDays = Array.from({ length: 10 }, (_, i) => dayRange(i).start);
  const heatSites = destinations.filter((d) => d.dailyCapacity <= 60).slice(0, 5);
  const holds = await prisma.bookingDestination.findMany({
    where: {
      destinationId: { in: heatSites.map((d) => d.id) },
      visitDate: { gte: heatDays[0], lt: dayRange(10).start },
      booking: { status: { in: ["pending_approval", "approved", "checked_in"] } },
    },
    include: { booking: true },
  });

  function usedFor(destId: number, day: Date) {
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return holds
      .filter((h) => h.destinationId === destId && h.visitDate >= day && h.visitDate < dayEnd)
      .reduce((s, h) => s + h.booking.paxAdults + h.booking.paxChildren, 0);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-ink-600">{shortDate(new Date())} · Bagulin, La Union</p>
        </div>
        <div className="flex gap-2">
          {paymentReviews > 0 && (
            <Link href="/admin/bookings?status=payment_review" className="btn btn-amber">
              {paymentReviews} payment{paymentReviews > 1 ? "s" : ""} to verify
            </Link>
          )}
          {pendingApprovals > 0 && (
            <Link href="/admin/bookings?status=pending_approval" className="btn btn-outline">
              {pendingApprovals} pending approval{pendingApprovals > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<UsersThreeIcon size={26} weight="duotone" />} label="Arrivals today" value={String(arrivals)} tone="brand" />
        <Stat icon={<ClockCountdownIcon size={26} weight="duotone" />} label="Pending approval" value={String(pendingApprovals)} tone="amber" />
        <Stat icon={<CoinsIcon size={26} weight="duotone" />} label="Revenue (MTD)" value={peso(revenueAgg._sum.amount ?? 0)} tone="brand" />
        <Stat icon={<PersonSimpleHikeIcon size={26} weight="duotone" />} label="Guides on duty" value={`${dutyToday.length} / ${totalGuides}`} tone="river" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Approval queue */}
        <section className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Approval queue</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-ink-600">No bookings awaiting approval. 🎉</p>
          ) : (
            <div className="space-y-2">
              {queue.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.bookingCode}`} className="flex items-center justify-between rounded-btn border border-line px-3 py-2.5 text-sm hover:bg-brand-100/40">
                  <div>
                    <span className="font-display font-bold text-brand-700">{b.bookingCode}</span>
                    <span className="ml-2 text-ink-600">{shortDate(b.visitDate)} · {b.paxAdults + b.paxChildren} pax</span>
                  </div>
                  <ArrowRightIcon size={16} className="text-ink-600" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Today's duty roster */}
        <section className="rounded-card border border-line bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Today&apos;s duty roster</h2>
          {dutyToday.length === 0 ? (
            <p className="text-sm text-ink-600">No guides on duty today.</p>
          ) : (
            <div className="space-y-2">
              {dutyToday.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-btn border border-line px-3 py-2.5 text-sm">
                  <span className="font-semibold">{a.guide.fullName}</span>
                  <span className="text-ink-600">{a.booking.destinations[0]?.destination.name ?? "—"}</span>
                  <span className="pill bg-brand-100 text-brand-700">{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Capacity heatmap */}
      <section className="mt-6 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-bold">Capacity heatmap — next 10 days</h2>
        <p className="mb-3 text-xs text-ink-600">Live visitor load vs daily eco-capacity. <span className="text-ok">green</span> open · <span className="text-warn">amber</span> filling · <span className="text-danger">red</span> full.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left font-semibold text-ink-600">Destination</th>
                {heatDays.map((d) => (
                  <th key={d.toISOString()} className="p-1 font-medium text-ink-600">{d.getMonth() + 1}/{d.getDate()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatSites.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap p-1 font-semibold">{s.name}</td>
                  {heatDays.map((day) => {
                    const used = usedFor(s.id, day);
                    const ratio = used / s.dailyCapacity;
                    const bg = ratio >= 1 ? "#B3261E" : ratio >= 0.6 ? "#FFB300" : ratio > 0 ? "#8fce9b" : "#E8F5E9";
                    return (
                      <td key={day.toISOString()} className="p-1">
                        <div className="mx-auto h-6 w-8 rounded" style={{ background: bg }} title={`${used}/${s.dailyCapacity}`} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "brand" | "amber" | "river" }) {
  const toneClass = tone === "amber" ? "text-cta-700" : tone === "river" ? "text-river-500" : "text-brand-700";
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className={toneClass}>{icon}</div>
      <div className="mt-2 font-display text-2xl font-extrabold">{value}</div>
      <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-600">{label}</div>
    </div>
  );
}
