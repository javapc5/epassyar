"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { DownloadSimpleIcon, CopyIcon, CheckIcon, SealCheckIcon } from "@phosphor-icons/react";
import { peso } from "@/lib/format";

export type Receipt = {
  code: string;
  statusLabel: string;
  verified: boolean;
  visitDate: string;
  travelers: string;
  typeLabel: string;
  touristName: string;
  total: number;
  reservationPaid: number;
  balance: number;
  gcashRef: string | null;
  gcashSender: string | null;
  paidAt: string;
  origin: string;
};

/**
 * A self-contained payment receipt the tourist can save as an image and keep.
 * Crucially it carries the BOOKING REFERENCE and the GCash reference number —
 * the reference is what they later need at /my-booking to check their status,
 * and it's the thing most easily forgotten.
 */
export default function ReceiptImage(r: Receipt) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function downloadImage() {
    if (!nodeRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(nodeRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ePassyar-receipt-${r.code}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  function copyDetails() {
    const lines = [
      "ePassyar — Payment Receipt",
      `Booking reference: ${r.code}`,
      `Status: ${r.statusLabel}`,
      `Lead tourist: ${r.touristName}`,
      `Visit date: ${r.visitDate}`,
      `Travelers: ${r.travelers}`,
      `Type: ${r.typeLabel}`,
      "",
      r.gcashRef ? `GCash reference: ${r.gcashRef}` : "",
      r.gcashSender ? `Paid from: ${r.gcashSender}` : "",
      `Reservation paid: ${peso(r.reservationPaid)}`,
      `Total: ${peso(r.total)}`,
      `Balance (pay on arrival): ${peso(r.balance)}`,
      `Submitted: ${r.paidAt}`,
      "",
      `Keep your reference ${r.code} — check your status anytime at ${r.origin}/my-booking`,
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-6">
      {/* The node captured as the downloadable image */}
      <div ref={nodeRef} className="overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center justify-between bg-brand-900 px-5 py-3 text-white">
          <span className="font-display text-sm font-extrabold tracking-wide">ePassyar</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-100">Payment Receipt</span>
        </div>

        <div className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">Booking reference — keep this</div>
          <div className="font-display text-3xl font-extrabold tracking-wide text-brand-700">{r.code}</div>

          <div
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              r.verified ? "bg-ok/15 text-ok" : "bg-amber-100 text-amber-800"
            }`}
          >
            <SealCheckIcon size={13} weight="fill" /> {r.statusLabel}
          </div>

          <dl className="mt-4 divide-y divide-dashed divide-line border-t border-dashed border-line text-sm">
            <Row k="Lead tourist" v={r.touristName} />
            <Row k="Visit date" v={r.visitDate} />
            <Row k="Travelers" v={r.travelers} />
            <Row k="Type" v={r.typeLabel} />
            {r.gcashRef && <Row k="GCash reference" v={r.gcashRef} mono />}
            {r.gcashSender && <Row k="Paid from" v={r.gcashSender} />}
            <Row k="Reservation paid" v={peso(r.reservationPaid)} strong />
            <Row k="Total" v={peso(r.total)} />
            <Row k="Balance on arrival" v={peso(r.balance)} />
            <Row k="Submitted" v={r.paidAt} />
          </dl>

          <p className="mt-4 text-[11px] leading-relaxed text-ink-600">
            Check your booking status anytime at <b>{r.origin.replace(/^https?:\/\//, "")}/my-booking</b> using this
            reference and the last 4 digits of your mobile number.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={downloadImage} disabled={busy} className="btn btn-green disabled:opacity-60">
          <DownloadSimpleIcon size={16} weight="bold" /> {busy ? "Preparing…" : "Save receipt image"}
        </button>
        <button onClick={copyDetails} className="btn btn-outline">
          {copied ? <CheckIcon size={16} weight="bold" /> : <CopyIcon size={16} />} {copied ? "Copied" : "Copy details"}
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, mono, strong }: { k: string; v: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-ink-600">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono" : ""} ${strong ? "font-display font-extrabold text-brand-700" : "font-semibold text-ink-900"}`}>{v}</dd>
    </div>
  );
}
