"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  WarningCircleIcon,
  SealCheckIcon,
  UsersThreeIcon,
  MapPinIcon,
  UserCircleCheckIcon,
  CalendarBlankIcon,
  ArrowClockwiseIcon,
} from "@phosphor-icons/react";

type Summary = {
  bookingCode: string;
  touristName: string;
  pax: number;
  visitDate: string;
  sites: string[];
  guides: string[];
  balance: number;
};
type Result = { ok?: boolean; already?: boolean; status?: string; scannedAt?: string | null; booking?: Summary; error?: string };

const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;

export default function CheckinPanel({ initialToken }: { initialToken: string | null }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const ranToken = useRef(false);

  async function submit(payload: { token?: string; code?: string }) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Network error — check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  // Auto check-in when arriving from a scanned QR (…/admin/checkin?t=TOKEN).
  useEffect(() => {
    if (initialToken && !ranToken.current) {
      ranToken.current = true;
      submit({ token: initialToken });
    }
  }, [initialToken]);

  const b = result?.booking;
  const success = result?.ok && !result?.already;
  const already = result?.ok && result?.already;

  return (
    <div className="space-y-4">
      {/* manual entry */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) submit({ code: code.trim() });
        }}
        className="card p-4"
      >
        <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-700">Enter booking code</label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BGL-XXXXXX"
            className="min-w-0 flex-1 rounded-btn border border-line px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-500"
          />
          <button disabled={busy || !code.trim()} className="btn btn-green shrink-0 disabled:opacity-60">
            {busy ? "Checking…" : "Check in"}
          </button>
        </div>
      </form>

      {/* result */}
      {(success || already) && b && (
        <div className={`card border-2 p-5 ${success ? "border-ok" : "border-warn"}`}>
          <div className={`mb-3 flex items-center gap-2 font-display text-lg font-extrabold ${success ? "text-ok" : "text-warn"}`}>
            {success ? <CheckCircleIcon size={26} weight="fill" /> : <SealCheckIcon size={26} weight="fill" />}
            {success ? "Checked in!" : "Already checked in"}
          </div>
          <div className="text-2xl font-extrabold text-ink-900">{b.touristName}</div>
          <div className="font-display font-bold text-brand-700">{b.bookingCode}</div>

          <div className="mt-3 grid gap-2 text-sm">
            <Row icon={<UsersThreeIcon size={16} weight="duotone" />} label="Party size" value={`${b.pax} pax`} />
            <Row icon={<CalendarBlankIcon size={16} weight="duotone" />} label="Visit date" value={new Date(b.visitDate).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })} />
            <Row icon={<MapPinIcon size={16} weight="duotone" />} label="Sites" value={b.sites.join(", ")} />
            <Row icon={<UserCircleCheckIcon size={16} weight="duotone" />} label="Guide(s)" value={b.guides.length ? b.guides.join(", ") : "—"} />
          </div>

          {b.balance > 0 && (
            <div className="mt-3 rounded-btn bg-cta-500/15 px-3 py-2 text-sm font-bold text-cta-700">
              Collect on-site balance: {peso(b.balance)}
            </div>
          )}
          {already && result?.scannedAt && (
            <div className="mt-2 text-xs text-ink-600">First scanned {new Date(result.scannedAt).toLocaleString("en-PH")}.</div>
          )}

          <button onClick={() => { setResult(null); setCode(""); }} className="btn btn-outline mt-4">
            <ArrowClockwiseIcon size={15} /> Check in another
          </button>
        </div>
      )}

      {result?.error && (
        <div className="card border-2 border-danger p-4">
          <div className="flex items-center gap-2 font-bold text-danger">
            <WarningCircleIcon size={20} weight="fill" /> {result.error}
          </div>
          {result.booking && (
            <div className="mt-2 text-sm text-ink-600">
              {result.booking.bookingCode} · {result.booking.touristName} · {result.booking.pax} pax
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-1.5">
      <span className="flex items-center gap-1.5 text-ink-600">{icon} {label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}
