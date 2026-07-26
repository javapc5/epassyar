"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeviceMobileIcon, CopyIcon, BankIcon, CheckIcon, MagnifyingGlassPlusIcon, XIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { peso } from "@/lib/format";

type Gcash = { name: string | null; number: string | null; qrUrl: string | null };

export default function PayPanel({
  code,
  reservationDue,
  expiresAt,
  gcash,
}: {
  code: string;
  reservationDue: number;
  expiresAt: string | null;
  gcash: Gcash;
}) {
  const router = useRouter();
  const [refNo, setRefNo] = useState("");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/bookings/${code}/pay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refNo, senderName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Submission failed.");
    router.refresh();
  }

  function copyNumber() {
    if (!gcash.number) return;
    navigator.clipboard?.writeText(gcash.number.replace(/[^\d]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hoursLeft = expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 3600000)) : null;

  return (
    <div className="mt-6 rounded-card border-2 border-cta-500 bg-cta-500/10 p-5">
      <div className="font-display text-lg font-bold">Pay reservation fee via GCash</div>
      <p className="mt-1 text-sm text-ink-600">
        Send <b className="text-brand-700">{peso(reservationDue)}</b> to the account below, then enter your GCash
        reference number so the Tourism Office can verify it.
        {hoursLeft !== null && <> This reservation expires in about <b>{hoursLeft} hour{hoursLeft === 1 ? "" : "s"}</b>.</>}
      </p>

      {/* Step 1 — send money */}
      <div className="mt-4 rounded-card border border-line bg-white p-4">
        <div className="text-center text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Step 1 — Scan &amp; send via GCash</div>

        {gcash.qrUrl ? (
          <div className="mt-3 flex flex-col items-center">
            <button type="button" onClick={() => setZoomed(true)} className="relative block w-full max-w-[300px]" aria-label="Enlarge QR code">
              {/* Large square QR with a generous white quiet-zone — needed for reliable scanning */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gcash.qrUrl}
                alt="GCash QR code"
                className="aspect-square w-full rounded-lg border border-line bg-white object-contain p-3"
              />
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                <MagnifyingGlassPlusIcon size={13} weight="bold" /> Tap to enlarge
              </span>
            </button>
            <a
              href={gcash.qrUrl}
              download={`gcash-qr-${code}.png`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
            >
              <DownloadSimpleIcon size={14} /> Save QR to scan from another phone
            </a>
          </div>
        ) : (
          <div className="mx-auto mt-3 flex h-40 w-40 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <DeviceMobileIcon size={48} weight="duotone" />
          </div>
        )}

        <div className="mt-4 border-t border-line pt-3 text-center">
          <div className="font-display text-lg font-extrabold">{gcash.name ?? "Bagulin Tourism Office"}</div>
          <button onClick={copyNumber} className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-base font-bold text-brand-700">
            {gcash.number ?? "—"} {copied ? <CheckIcon size={15} weight="bold" /> : <CopyIcon size={15} />}
          </button>
          <div className="mt-1 text-sm text-ink-900">Amount: <b className="text-brand-700">{peso(reservationDue)}</b></div>
          <div className="mt-0.5 text-xs text-ink-600">Keep your receipt — you&apos;ll need the reference number below.</div>
        </div>
      </div>

      {/* Fullscreen QR — maximum size for scanning */}
      {zoomed && gcash.qrUrl && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcash.qrUrl} alt="GCash QR code" className="mx-auto h-[80vw] max-h-[420px] w-[80vw] max-w-[420px] object-contain" />
            <div className="mt-3 text-center">
              <div className="font-display text-lg font-extrabold">{gcash.name ?? "Bagulin Tourism Office"}</div>
              <div className="font-mono text-base font-bold text-brand-700">{gcash.number}</div>
              <div className="text-sm">Send <b className="text-brand-700">{peso(reservationDue)}</b></div>
            </div>
          </div>
          <button onClick={() => setZoomed(false)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-900">
            <XIcon size={16} weight="bold" /> Close
          </button>
        </div>
      )}

      {/* Step 2 — submit reference */}
      <div className="mt-3 rounded-card border border-line bg-white p-4">
        <div className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Step 2 — Submit your reference number</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            placeholder="GCash Ref No. (e.g. 1023456789012)"
            inputMode="numeric"
            className="w-full rounded-btn border border-line px-3 py-2 font-mono text-sm"
          />
          <input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Name on the GCash account"
            className="w-full rounded-btn border border-line px-3 py-2 text-sm"
          />
        </div>
        {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
        <button onClick={submit} disabled={loading} className="btn btn-amber mt-3 w-full disabled:opacity-60">
          {loading ? "Submitting…" : "Submit for verification"}
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ink-600">
        <BankIcon size={16} weight="duotone" className="mt-0.5 shrink-0" />
        <span>Prefer cash? You can also pay the reservation fee at the Municipal Treasurer&apos;s Office — mention your booking code <b className="whitespace-nowrap">{code}</b> and the cashier will record it.</span>
      </div>
    </div>
  );
}
