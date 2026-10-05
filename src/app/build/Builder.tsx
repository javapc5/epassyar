"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  XIcon,
  PersonSimpleHikeIcon,
  MapPinIcon,
  ReceiptIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { peso } from "@/lib/format";

type Dest = {
  id: number; name: string; barangay: string; category: string;
  guideRequired: boolean; trekkingDuration: string | null; activities: string[];
};
type Transport = { id: number; routeName: string; vehicleType: string | null; feePerPax: number | null; feePerTrip: number | null };
type FeeLine = { feeCode: string; label: string; lineTotal: number };
type Quote = { lines: FeeLine[]; total: number; reservationDue: number; balance: number };
type Cap = { id: number; remaining: number; enough: boolean };

function localDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

export default function Builder({ destinations, transport }: { destinations: Dest[]; transport: Transport[] }) {
  const router = useRouter();
  const tomorrow = localDate(1);

  const [selected, setSelected] = useState<number[]>([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [date, setDate] = useState(() => localDate(2));
  const [transportId, setTransportId] = useState<number | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [capacity, setCapacity] = useState<Cap[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [origin, setOrigin] = useState("");
  const [hasBaggage, setHasBaggage] = useState(false);
  const [baggageKg, setBaggageKg] = useState(5);
  const [baggageNotes, setBaggageNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from hero search bar (?date=&pax=&add=) or "Add to itinerary" links (?add=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("date");
    const p = parseInt(params.get("pax") ?? "0", 10);
    const addId = Number(params.get("add"));
    if (d) setDate(d);
    if (p >= 1) setAdults(p);
    if (addId && destinations.some((dest) => dest.id === addId)) {
      setSelected((s) => (s.includes(addId) ? s : [...s, addId]));
    }
  }, [destinations]);

  const selectedDests = selected.map((id) => destinations.find((d) => d.id === id)!).filter(Boolean);
  const anyGuideRequired = selectedDests.some((d) => d.guideRequired);

  const refreshQuote = useCallback(async () => {
    if (selected.length === 0) {
      setQuote(null);
      setCapacity([]);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ destinationIds: selected, adults, children, transportRouteId: transportId, visitDate: date }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setQuote(data.quote);
      setCapacity(data.capacity);
    }
  }, [selected, adults, children, transportId, date]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const capacityIssue = capacity.find((c) => !c.enough);

  async function reserve() {
    setError("");
    if (!name || !mobile) return setError("Please enter your name and mobile number.");
    if (selected.length === 0) return setError("Add at least one destination.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookingType: "custom",
          destinationIds: selected,
          adults, children, visitDate: date,
          transportRouteId: transportId,
          touristName: name, touristMobile: mobile, touristOrigin: origin,
          baggageKg: hasBaggage ? baggageKg : 0,
          baggageNotes: hasBaggage ? baggageNotes : "",
        }),
      });
      // Read the body defensively: a 500/504 can return an HTML error page, and
      // res.json() would otherwise throw and leave the button stuck forever.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.bookingCode) {
        return setError(data?.error ?? "Couldn't create your reservation. Please try again.");
      }
      router.push(`/booking/${data.bookingCode}`);
    } catch {
      setError("Network problem — your reservation didn't go through. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* LEFT: pick destinations */}
      <div>
        <div className="flex flex-wrap items-end gap-4 rounded-card border border-line bg-white p-4 shadow-card">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Visit date</label>
            <input type="date" value={date} min={tomorrow} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-btn border border-line px-3 py-2.5 text-sm" />
          </div>
          <Counter label="Adults" value={adults} set={(v) => setAdults(Math.max(1, v))} min={1} />
          <Counter label="Children" value={children} set={(v) => setChildren(Math.max(0, v))} min={0} />
        </div>

        <h3 className="mt-5 font-display text-lg font-bold">Choose destinations</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {destinations.map((d) => {
            const on = selected.includes(d.id);
            const cap = capacity.find((c) => c.id === d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggle(d.id)}
                className={`rounded-card border-2 p-3 text-left transition ${on ? "border-brand-700 bg-brand-100" : "border-line bg-white hover:border-brand-500"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-[15px] font-bold">{d.name}</div>
                    <div className="flex items-center gap-1 text-xs text-ink-600"><MapPinIcon size={12} /> Brgy. {d.barangay}</div>
                  </div>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${on ? "bg-brand-700 text-white" : "border border-line text-ink-600"}`}>
                    {on ? "✓" : "+"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#f0f4ef] px-2 py-0.5 text-[10.5px] font-semibold text-[#41564a]">{d.category}</span>
                  {d.guideRequired && (
                    <span className="pill bg-[#fff3d6] text-[10.5px] text-[#8a6100]"><PersonSimpleHikeIcon size={11} weight="fill" /> Guide</span>
                  )}
                  {on && cap && (
                    <span className={`pill text-[10.5px] ${cap.enough ? "bg-brand-100 text-brand-700" : "bg-red-100 text-danger"}`}>
                      {cap.remaining} slots left
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {anyGuideRequired && (
          <div className="mt-4">
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Transport (optional)</label>
            <select value={transportId ?? ""} onChange={(e) => setTransportId(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-btn border border-line px-3 py-2 text-sm">
              <option value="">No transport needed</option>
              {transport.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.routeName} — {t.vehicleType} {t.feePerPax ? `(${peso(t.feePerPax)}/pax)` : t.feePerTrip ? `(${peso(t.feePerTrip)}/trip)` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* RIGHT: live quote */}
      <aside className="h-fit rounded-card border border-line bg-white p-5 shadow-card lg:sticky lg:top-20">
        <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-brand-700">
          <ReceiptIcon size={18} weight="duotone" /> Your itinerary quote
        </h4>

        {selected.length === 0 ? (
          <p className="mt-3 text-sm text-ink-600">Select destinations to see your live cost breakdown.</p>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedDests.map((d) => (
                <span key={d.id} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {d.name}
                  <XIcon size={11} className="cursor-pointer" onClick={() => toggle(d.id)} />
                </span>
              ))}
            </div>

            {loading && !quote ? (
              <p className="mt-3 text-sm text-ink-600">Calculating…</p>
            ) : quote ? (
              <div className="mt-3">
                {quote.lines.map((l) => (
                  <div key={l.feeCode + l.label} className="flex justify-between border-b border-dashed border-line py-1.5 text-[13.5px]">
                    <span>{l.label}</span>
                    <b>{peso(l.lineTotal)}</b>
                  </div>
                ))}
                <div className="mt-1.5 flex justify-between border-t-2 border-brand-700 pt-2.5 font-display text-[15px] font-extrabold">
                  <span>Total</span><span>{peso(quote.total)}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-brand-700"><span>Reserve now (20%)</span><span>{peso(quote.reservationDue)}</span></div>
                <div className="flex justify-between text-[12.5px] text-ink-600"><span>Balance on arrival</span><span>{peso(quote.balance)}</span></div>
              </div>
            ) : null}

            {capacityIssue && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">
                <WarningCircleIcon size={16} weight="fill" className="mt-0.5 shrink-0" />
                One destination doesn&apos;t have enough slots for {adults + children} travelers on this date. Try another date or fewer travelers.
              </div>
            )}

            <div className="mt-4 space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number (09xx…)" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Where are you from? (city/province)" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
            </div>

            {/* Extra baggage — helps the assigned guide plan the trek/transport */}
            <div className="mt-3 rounded-btn border border-line bg-bg p-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={hasBaggage} onChange={(e) => setHasBaggage(e.target.checked)} className="h-4 w-4 accent-brand-700" />
                Bringing extra baggage? (camping gear, coolers, equipment…)
              </label>
              {hasBaggage && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ink-600">Approx. weight:</span>
                    <input type="number" min={1} max={100} value={baggageKg} onChange={(e) => setBaggageKg(Number(e.target.value))} className="w-20 rounded-btn border border-line px-2 py-1.5 text-sm" />
                    <b>kg</b>
                  </div>
                  <input value={baggageNotes} onChange={(e) => setBaggageNotes(e.target.value)} placeholder="What are you bringing? (optional)" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
                  <p className="text-[11px] text-ink-600">This is shared with your assigned guide so they can plan the trek and transport.</p>
                </div>
              )}
            </div>

            {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}

            <button onClick={reserve} disabled={submitting || !!capacityIssue} className="btn btn-amber mt-3 w-full disabled:opacity-60">
              {submitting ? "Reserving…" : quote ? `Reserve — ${peso(quote.reservationDue)}` : "Reserve"}
            </button>
            <div className="mt-2 text-center text-[11px] text-ink-600">Unpaid reservations expire after 24 hours.</div>
          </>
        )}
      </aside>
    </div>
  );
}

function Counter({ label, value, set, min }: { label: string; value: number; set: (v: number) => void; min: number }) {
  return (
    <div>
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" aria-label={`decrease ${label}`} onClick={() => set(value - 1)} disabled={value <= min} className="h-11 w-11 rounded-btn border border-line text-lg font-bold disabled:opacity-40">−</button>
        <span className="w-6 text-center font-display text-lg font-bold">{value}</span>
        <button type="button" aria-label={`increase ${label}`} onClick={() => set(value + 1)} className="h-11 w-11 rounded-btn border border-line text-lg font-bold">+</button>
      </div>
    </div>
  );
}
