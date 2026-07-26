import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ChatCircleTextIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, shortDate, statusMeta } from "@/lib/format";
import { suggestGuides } from "@/lib/availability";
import ApprovePanel from "./ApprovePanel";
import PaymentPanel from "./PaymentPanel";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } },
      fees: true,
      payments: true,
      tourPackage: true,
      assignments: { include: { guide: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
      smsLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  const meta = statusMeta(booking.status);
  const pax = booking.paxAdults + booking.paxChildren;

  // Guide suggestions for the approval step
  let suggestions: { id: number; fullName: string; barangay: string; recentDuties: number; ratingAvg: number; score: number }[] = [];
  if (booking.status === "pending_approval") {
    const barangays = [...new Set(booking.destinations.map((d) => d.destination.barangay))];
    const needsAdventure = booking.destinations.some((d) => /adventure|rappel/i.test(d.destination.category));
    const ranked = await suggestGuides(booking.municipalityId, barangays, booking.visitDate, needsAdventure);
    suggestions = ranked.map((r) => ({
      id: r.guide.id, fullName: r.guide.fullName, barangay: r.guide.barangay,
      recentDuties: r.recentDuties, ratingAvg: r.guide.ratingAvg, score: Math.round(r.score),
    }));
  }

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeftIcon size={15} /> Back to bookings
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-700">{booking.bookingCode}</h1>
          <p className="text-sm text-ink-600">{shortDate(booking.visitDate)} · {booking.bookingType === "package" ? booking.tourPackage?.name : "Custom itinerary"}</p>
        </div>
        <span className={`pill ${meta.className}`}>{meta.label}</span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Tourist">
            <Row label="Name" value={booking.touristName} />
            <Row label="Mobile" value={booking.touristMobile} />
            <Row label="Origin" value={booking.touristOrigin ?? "—"} />
            <Row label="Travelers" value={`${booking.paxAdults} adults, ${booking.paxChildren} children`} />
            <Row label="Extra baggage" value={booking.baggageKg > 0 ? `~${booking.baggageKg} kg${booking.baggageNotes ? ` — ${booking.baggageNotes}` : ""}` : "None"} />
            {booking.baggageKg > 0 && (
              <div className="mt-1 rounded-lg bg-[#fff3d6] px-3 py-2 text-[12px] font-semibold text-[#8a6100]">
                🎒 Baggage info is included in the guide&apos;s duty SMS so they can plan the trek and transport.
              </div>
            )}
          </Card>

          <Card title="Itinerary">
            {booking.destinations.map((bd, i) => (
              <div key={bd.id} className="flex items-center gap-2 py-1 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                {bd.destination.name} <span className="text-ink-600">· Brgy. {bd.destination.barangay}</span>
                {bd.destination.guideRequired && <span className="pill bg-[#fff3d6] text-[#8a6100]">guide</span>}
              </div>
            ))}
          </Card>

          <Card title="Cost breakdown">
            {booking.fees.map((f) => (
              <div key={f.id} className="flex justify-between border-b border-dashed border-line py-1.5 text-sm">
                <span>{f.label}</span><b>{peso(f.lineTotal)}</b>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between font-display font-extrabold"><span>Total</span><span>{peso(booking.totalAmount)}</span></div>
            <div className="flex justify-between text-sm text-ink-600"><span>Paid</span><span>{peso(booking.amountPaid)}</span></div>
            <div className="flex justify-between text-sm text-ink-600"><span>Balance</span><span>{peso(booking.totalAmount - booking.amountPaid)}</span></div>
          </Card>

          <Card title="Status history">
            {booking.statusLogs.map((l) => (
              <div key={l.id} className="flex justify-between py-1 text-[13px]">
                <span>{l.note ?? l.toStatus}</span>
                <span className="text-ink-600">{shortDate(l.createdAt)}</span>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          {(booking.status === "pending_payment" || booking.status === "payment_review") && (
            <PaymentPanel
              bookingCode={booking.bookingCode}
              bookingStatus={booking.status}
              reservationDue={booking.reservationDue}
              pendingPayment={(() => {
                const p = booking.payments.find((x) => x.status === "pending");
                return p ? { id: p.id, amount: p.amount, gatewayRef: p.gatewayRef, senderName: p.senderName, createdAt: p.createdAt.toISOString() } : null;
              })()}
            />
          )}

          {booking.status === "pending_approval" && (
            <ApprovePanel code={booking.bookingCode} guidesNeeded={Math.max(1, Math.ceil(pax / 10))} suggestions={suggestions} />
          )}

          {booking.payments.length > 0 && (
            <Card title="Payments">
              {booking.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-line py-1.5 text-[13px] last:border-0">
                  <span className="font-semibold">{peso(p.amount)}</span>
                  <span className="text-ink-600">{p.method}{p.gatewayRef ? ` · ${p.gatewayRef}` : ""}{p.orNumber ? ` · OR ${p.orNumber}` : ""}</span>
                  <span className={`pill ${p.status === "paid" ? "bg-brand-100 text-brand-700" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-danger"}`}>{p.status}</span>
                </div>
              ))}
            </Card>
          )}

          {booking.assignments.length > 0 && (
            <Card title="Assigned guide(s)">
              {booking.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-semibold">{a.guide.fullName}</span>
                  <span className="text-ink-600">Brgy. {a.guide.barangay}</span>
                  <span className="pill bg-brand-100 text-brand-700">{a.status}</span>
                </div>
              ))}
            </Card>
          )}

          <Card title={<span className="flex items-center gap-1.5"><ChatCircleTextIcon size={16} weight="duotone" /> SMS log</span>}>
            {booking.smsLogs.length === 0 ? (
              <p className="text-sm text-ink-600">No messages yet.</p>
            ) : (
              booking.smsLogs.map((s) => (
                <div key={s.id} className="border-b border-line py-2 text-[12.5px] last:border-0">
                  <div className="font-semibold text-brand-700">{s.template} → {s.recipientType}</div>
                  <div className="text-ink-600">{s.message}</div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 font-display text-[15px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-ink-600">{label}</span><span className="font-semibold">{value}</span>
    </div>
  );
}
