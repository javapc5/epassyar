"use client";

import { useState } from "react";
import { DownloadSimpleIcon, SealCheckIcon } from "@phosphor-icons/react";
import { downloadQrWithCaption } from "./downloadQr";

/**
 * The QR Tourist Pass shown once a booking is approved. The tourist presents it
 * on arrival; staff scan it to check in. The pass is downloadable so it can be
 * saved offline / shown without reopening the site — the booking reference and
 * visit date are baked into the saved image.
 */
export default function PassCard({
  qrImage,
  code,
  guideName,
  guideBarangay,
  visitDate,
  balanceText,
  checkedIn,
}: {
  qrImage: string | null;
  code: string;
  guideName?: string;
  guideBarangay?: string;
  visitDate: string;
  balanceText: string;
  checkedIn: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!qrImage) return;
    setBusy(true);
    try {
      await downloadQrWithCaption(qrImage, `tourist-pass-${code}.png`, [
        { text: code, big: true },
        { text: `Visit: ${visitDate}` },
        { text: "ePassyar Tourist Pass" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 border-t border-line pt-6 text-center">
      <div className="font-display text-lg font-bold text-brand-700">Your QR Tourist Pass</div>
      {guideName && (
        <div className="mt-1 text-sm text-ink-900">
          Guide: <b>{guideName}</b>
          {guideBarangay ? ` (Brgy. ${guideBarangay})` : ""}
        </div>
      )}

      <div className="mx-auto mt-3 w-fit rounded-xl border border-line bg-white p-3">
        {qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrImage} alt={`QR tourist pass for ${code}`} width={176} height={176} className="h-44 w-44" />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center font-display text-sm font-bold text-ink-600">{code}</div>
        )}
      </div>

      <div className="mt-2 font-display text-base font-extrabold tracking-wide text-brand-700">{code}</div>

      {qrImage && (
        <button onClick={download} disabled={busy} className="btn btn-outline mt-3 disabled:opacity-60">
          <DownloadSimpleIcon size={16} weight="bold" /> {busy ? "Preparing…" : "Download pass"}
        </button>
      )}

      <p className="mx-auto mt-3 max-w-sm text-xs text-ink-600">
        The guide or staff scans this on arrival. Balance <b>{balanceText}</b> payable on-site.
      </p>

      {checkedIn && (
        <div className="mx-auto mt-2 flex w-fit items-center gap-1 rounded-full bg-ok/15 px-3 py-1 text-xs font-bold text-ok">
          <SealCheckIcon size={13} weight="fill" /> Checked in — enjoy your visit!
        </div>
      )}
    </div>
  );
}
