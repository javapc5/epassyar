"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { peso } from "@/lib/format";

type Pkg = { id: number; name: string; pricePerPax: number; minPax: number; maxPax: number };

export default function PackageBooking({ pkg }: { pkg: Pkg }) {
  const router = useRouter();
  const today = new Date();
  today.setDate(today.getDate() + 2);
  const [date, setDate] = useState(today.toISOString().slice(0, 10));
  const [pax, setPax] = useState(pkg.minPax);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [origin, setOrigin] = useState("");
  const [hasBaggage, setHasBaggage] = useState(false);
  const [baggageKg, setBaggageKg] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = pkg.pricePerPax * pax;
  const reservationDue = Math.round(total * 0.2 * 100) / 100;

  async function submit() {
    setError("");
    if (!name || !mobile) {
      setError("Please enter your name and mobile number.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookingType: "package",
        packageId: pkg.id,
        visitDate: date,
        adults: pax,
        children: 0,
        touristName: name,
        touristMobile: mobile,
        touristOrigin: origin,
        baggageKg: hasBaggage ? baggageKg : 0,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push(`/booking/${data.bookingCode}`);
  }

  return (
    <aside className="h-fit rounded-card border border-line bg-white p-5 shadow-card lg:sticky lg:top-20">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-semibold text-ink-600">From</span>
          <div className="font-display text-2xl font-extrabold text-brand-700">{peso(pkg.pricePerPax)}<span className="text-sm font-semibold text-ink-600"> / person</span></div>
        </div>
      </div>

      <label className="mt-4 block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Visit date</label>
      <input type="date" value={date} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-btn border border-line px-3 py-2 text-sm" />

      <label className="mt-3 block text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Travelers</label>
      <div className="mt-1 flex items-center gap-3">
        <button type="button" aria-label="decrease travelers" onClick={() => setPax(Math.max(pkg.minPax, pax - 1))} className="h-11 w-11 rounded-btn border border-line text-lg font-bold">−</button>
        <span className="font-display text-lg font-bold">{pax}</span>
        <button type="button" aria-label="increase travelers" onClick={() => setPax(Math.min(pkg.maxPax, pax + 1))} className="h-11 w-11 rounded-btn border border-line text-lg font-bold">+</button>
        <span className="text-xs text-ink-600">max {pkg.maxPax}</span>
      </div>

      <div className="mt-4 space-y-2 border-t border-dashed border-line pt-3 text-sm">
        <div className="flex justify-between"><span>{peso(pkg.pricePerPax)} × {pax} pax</span><b>{peso(total)}</b></div>
        <div className="flex justify-between font-display text-[15px] font-extrabold text-brand-700"><span>Reserve now (20%)</span><span>{peso(reservationDue)}</span></div>
        <div className="flex justify-between text-[12.5px] text-ink-600"><span>Balance on arrival</span><span>{peso(total - reservationDue)}</span></div>
      </div>

      <div className="mt-4 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number (09xx…)" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
        <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Where are you from? (city/province)" className="w-full rounded-btn border border-line px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 pt-1 text-[13px] font-semibold">
          <input type="checkbox" checked={hasBaggage} onChange={(e) => setHasBaggage(e.target.checked)} className="h-4 w-4 accent-brand-700" />
          Extra baggage?
        </label>
        {hasBaggage && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-600">Approx.</span>
            <input type="number" min={1} max={100} value={baggageKg} onChange={(e) => setBaggageKg(Number(e.target.value))} className="w-20 rounded-btn border border-line px-2 py-1.5 text-sm" />
            <b>kg</b>
            <span className="text-[11px] text-ink-600">— shared with your guide</span>
          </div>
        )}
      </div>

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}

      <button onClick={submit} disabled={submitting} className="btn btn-amber mt-3 w-full disabled:opacity-60">
        {submitting ? "Reserving…" : `Reserve — ${peso(reservationDue)}`}
      </button>
      <div className="mt-2 text-center text-[11px] text-ink-600">Unpaid reservations expire after 24 hours.</div>
    </aside>
  );
}
