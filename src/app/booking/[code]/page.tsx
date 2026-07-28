import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hasBookingAccess } from "@/lib/booking-access";
import { getSessionUser } from "@/lib/auth";
import { peso, shortDate, statusMeta } from "@/lib/format";
import { qrDataUrl, checkInUrl } from "@/lib/qr";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PayPanel from "./PayPanel";
import StatusTracker from "./StatusTracker";
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // This page carries tourist PII and the QR pass, so the reference code alone is
  // not enough to open it. Access comes from submitting the booking or clearing
  // the /my-booking check (code + last 4 digits of the mobile on file). Signed-in
  // Tourism Office staff are let through so they can open a link a tourist sends.
  const [entitled, staff] = await Promise.all([hasBookingAccess(code), getSessionUser()]);
  if (!entitled && !staff) {
    redirect(`/my-booking?code=${encodeURIComponent(code)}&verify=1`);
  }

  const [booking, muni] = await Promise.all([
    prisma.booking.findUnique({
      where: { bookingCode: code },
      include: {
        fees: true,
        destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } },
        tourPackage: true,
        assignments: { include: { guide: true } },
        qrPass: true,
      },
    }),
    prisma.municipality.findUnique({ where: { id: 1 } }),
  ]);
  if (!booking) notFound();

  const meta = statusMeta(booking.status);

  // Real, scannable QR pass — encodes the staff-gated check-in URL.
  let qrImage: string | null = null;
  if (booking.qrPass?.token) {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    qrImage = await qrDataUrl(checkInUrl(`${proto}://${host}`, booking.qrPass.token));
  }
  const pax = booking.paxAdults + booking.paxChildren;

  return (
    <>
      <SiteHeader />
      <main className="wrap max-w-3xl py-8">
        <div className="rounded-card border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-ink-600">Booking reference</div>
              <div className="font-display text-2xl font-extrabold tracking-wide text-brand-700">{booking.bookingCode}</div>
            </div>
            <span className={`pill ${meta.className}`}>{meta.label}</span>
          </div>

          <div className="mt-4">
            <StatusTracker status={booking.status} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Visit date" value={shortDate(booking.visitDate)} />
            <Info label="Travelers" value={`${booking.paxAdults} adult${booking.paxAdults > 1 ? "s" : ""}${booking.paxChildren ? `, ${booking.paxChildren} child` : ""}`} />
            <Info label="Type" value={booking.bookingType === "package" ? booking.tourPackage?.name ?? "Package" : "Custom itinerary"} />
            <Info label="Lead tourist" value={booking.touristName} />
            {booking.baggageKg > 0 && (
              <Info label="Extra baggage" value={`~${booking.baggageKg} kg${booking.baggageNotes ? ` — ${booking.baggageNotes}` : ""}`} />
            )}
          </div>

          <h3 className="mt-6 font-display text-lg font-bold">Itinerary</h3>
          <div className="mt-2 space-y-1.5">
            {booking.destinations.map((bd, i) => (
              <div key={bd.id} className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
                {bd.destination.name} <span className="text-ink-600">· Brgy. {bd.destination.barangay}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 font-display text-lg font-bold">Cost breakdown</h3>
          <div className="mt-2">
            {booking.fees.map((f) => (
              <div key={f.id} className="flex justify-between border-b border-dashed border-line py-1.5 text-sm">
                <span>{f.label}</span><b>{peso(f.lineTotal)}</b>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between border-t-2 border-brand-700 pt-2.5 font-display text-base font-extrabold">
              <span>Total</span><span>{peso(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold text-brand-700"><span>Reservation fee</span><span>{peso(booking.reservationDue)}</span></div>
            <div className="flex justify-between text-[13px] text-ink-600"><span>Paid so far</span><span>{peso(booking.amountPaid)}</span></div>
            <div className="flex justify-between text-[13px] text-ink-600"><span>Balance (pay on arrival)</span><span>{peso(booking.totalAmount - booking.amountPaid)}</span></div>
          </div>

          {booking.status === "pending_payment" && (
            <PayPanel
              code={booking.bookingCode}
              reservationDue={booking.reservationDue}
              expiresAt={booking.expiresAt?.toISOString() ?? null}
              gcash={{ name: muni?.gcashName ?? null, number: muni?.gcashNumber ?? null, qrUrl: muni?.gcashQrUrl ?? null }}
            />
          )}

          {booking.status === "payment_review" && (
            <div className="mt-6 rounded-card bg-amber-50 p-4 text-sm text-amber-800">
              <SealCheckIcon size={18} weight="fill" className="mr-1 inline" />
              GCash reference received. The Tourism Office is verifying your payment — you&apos;ll get an SMS once confirmed (usually within office hours).
            </div>
          )}

          {booking.status === "pending_approval" && (
            <div className="mt-6 rounded-card bg-river-100/50 p-4 text-sm text-river-500">
              <SealCheckIcon size={18} weight="fill" className="mr-1 inline" />
              Reservation fee received. The Tourism Office is reviewing your booking and assigning your guide. You&apos;ll get an SMS once approved.
            </div>
          )}

          {(booking.status === "approved" || booking.status === "checked_in" || booking.status === "completed") && (
            <div className="mt-6 rounded-card border border-brand-100 bg-brand-100/50 p-5 text-center">
              <div className="font-display text-lg font-bold text-brand-700">Your QR Tourist Pass</div>
              {booking.assignments[0] && (
                <div className="mt-1 text-sm text-ink-900">Guide: <b>{booking.assignments[0].guide.fullName}</b> (Brgy. {booking.assignments[0].guide.barangay})</div>
              )}
              <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-3 shadow-card">
                {qrImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrImage} alt={`QR tourist pass for ${booking.bookingCode}`} width={160} height={160} className="h-40 w-40" />
                ) : (
                  <QrPlaceholder text={booking.bookingCode} />
                )}
              </div>
              <div className="mt-1.5 font-display text-sm font-bold tracking-wide text-brand-700">{booking.bookingCode}</div>
              <div className="mt-1 text-xs text-ink-600">The guide or Tourism Office scans this on arrival. Balance {peso(booking.totalAmount - booking.amountPaid)} payable on-site.</div>
              {booking.status === "checked_in" && (
                <div className="mx-auto mt-2 flex w-fit items-center gap-1 rounded-full bg-ok/15 px-3 py-1 text-xs font-bold text-ok"><SealCheckIcon size={13} weight="fill" /> Checked in — enjoy your visit!</div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-ink-600">
          Track this booking anytime at <Link href="/my-booking" className="font-semibold text-brand-700 hover:underline">My Booking</Link>.
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-bg p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">{label}</div>
      <div className="font-display text-[15px] font-bold">{value}</div>
    </div>
  );
}

/** Deterministic faux-QR grid (visual only — real QR generated in production). */
function QrPlaceholder({ text }: { text: string }) {
  const cells = 21;
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
  const rand = (i: number) => ((Math.sin(seed + i) + 1) / 2 > 0.5 ? 1 : 0);
  return (
    <svg width="140" height="140" viewBox={`0 0 ${cells} ${cells}`} shapeRendering="crispEdges">
      <rect width={cells} height={cells} fill="white" />
      {Array.from({ length: cells * cells }).map((_, i) => {
        const x = i % cells, y = Math.floor(i / cells);
        const finder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
        const on = finder ? (x % 6 === 0 || y % 6 === 0 || (x > 1 && x < 5 && y > 1 && y < 5)) : rand(i) === 1;
        return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#0E3D12" /> : null;
      })}
    </svg>
  );
}
