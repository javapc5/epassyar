"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeviceMobileIcon, CopyIcon, BankIcon, CheckIcon, MagnifyingGlassPlusIcon, XIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { peso } from "@/lib/format";

type Gcash = { name: string | null; number: string | null; qrUrl: string | null };

/** Same GCash manual-verification pattern as the booking PayPanel, for a product order. */
export default function ProductPaymentPanel({
  orderCode,
  totalAmount,
  expiresAt,
  gcash,
}: {
  orderCode: string;
  totalAmount: number;
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
    const res = await fetch(`/api/products/orders/${orderCode}/pay`, {
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
    <div className="mt-3 rounded-card border-2 border-cta-500 bg-cta-500/10 p-4">
      <div className="font-display text-[15px] font-bold">Pay for order {orderCode} via GCash</div>
      <p className="mt-1 text-[13px] text-ink-600">
        Send <b className="text-brand-700">{peso(totalAmount)}</b> in full, then enter your GCash reference number.
        {hoursLeft !== null && <> This order expires in about <b>{hoursLeft} hour{hoursLeft === 1 ? "" : "s"}</b>.</>}
      </p>

      <div className="mt-3 rounded-card border border-line bg-white p-3">
        <div className="text-center text-[10.5px] font-extrabold uppercase tracking-wide text-brand-700">Step 1 — Scan &amp; send via GCash</div>

        {gcash.qrUrl ? (
          <div className="mt-2 flex flex-col items-center">
            <button type="button" onClick={() => setZoomed(true)} className="relative block w-full max-w-[240px]" aria-label="Enlarge QR code">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gcash.qrUrl} alt="GCash QR code" className="aspect-square w-full rounded-lg border border-line bg-white object-contain p-2" />
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                <MagnifyingGlassPlusIcon size={12} weight="bold" /> Tap to enlarge
              </span>
            </button>
            <a href={gcash.qrUrl} download={`gcash-qr-${orderCode}.png`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline">
              <DownloadSimpleIcon size={13} /> Save QR to scan from another phone
            </a>
          </div>
        ) : (
          <div className="mx-auto mt-2 flex h-28 w-28 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <DeviceMobileIcon size={40} weight="duotone" />
          </div>
        )}

        <div className="mt-3 border-t border-line pt-2.5 text-center">
          <div className="font-display text-base font-extrabold">{gcash.name ?? "ePassyar"}</div>
          <button onClick={copyNumber} className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-brand-700">
            {gcash.number ?? "—"} {copied ? <CheckIcon size={14} weight="bold" /> : <CopyIcon size={14} />}
          </button>
          <div className="mt-1 text-[13px] text-ink-900">Amount: <b className="text-brand-700">{peso(totalAmount)}</b></div>
        </div>
      </div>

      {zoomed && gcash.qrUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4" onClick={() => setZoomed(false)}>
          <div className="rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gcash.qrUrl} alt="GCash QR code" className="mx-auto h-[80vw] max-h-[420px] w-[80vw] max-w-[420px] object-contain" />
            <div className="mt-3 text-center">
              <div className="font-display text-lg font-extrabold">{gcash.name ?? "ePassyar"}</div>
              <div className="font-mono text-base font-bold text-brand-700">{gcash.number}</div>
              <div className="text-sm">Send <b className="text-brand-700">{peso(totalAmount)}</b></div>
            </div>
          </div>
          <button onClick={() => setZoomed(false)} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink-900">
            <XIcon size={16} weight="bold" /> Close
          </button>
        </div>
      )}

      <div className="mt-3 rounded-card border border-line bg-white p-3">
        <div className="text-[10.5px] font-extrabold uppercase tracking-wide text-brand-700">Step 2 — Submit your reference number</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            placeholder="GCash Ref No."
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

      <div className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-600">
        <BankIcon size={15} weight="duotone" className="mt-0.5 shrink-0" />
        <span>Prefer cash? Pay in person at our office — mention order <b className="whitespace-nowrap">{orderCode}</b>.</span>
      </div>
    </div>
  );
}
