"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon, XCircleIcon, DeviceMobileIcon, BankIcon } from "@phosphor-icons/react";
import { peso } from "@/lib/format";

type PendingPayment = { id: number; amount: number; gatewayRef: string | null; senderName: string | null; createdAt: string };

/** Admin: verify a submitted GCash payment, or record a treasurer cash payment. */
export default function PaymentPanel({
  bookingCode,
  bookingStatus,
  reservationDue,
  pendingPayment,
}: {
  bookingCode: string;
  bookingStatus: string;
  reservationDue: number;
  pendingPayment: PendingPayment | null;
}) {
  const router = useRouter();
  const [orNumber, setOrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function call(payload: any) {
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Action failed.");
    router.refresh();
  }

  return (
    <section className="rounded-card border-2 border-cta-500 bg-cta-500/10 p-4">
      <h2 className="font-display text-[15px] font-bold">Payment verification</h2>

      {bookingStatus === "payment_review" && pendingPayment ? (
        <>
          <div className="mt-2 rounded-card border border-line bg-white p-3 text-sm">
            <div className="flex items-center gap-1.5 font-semibold text-brand-700">
              <DeviceMobileIcon size={16} weight="duotone" /> GCash — {peso(pendingPayment.amount)}
            </div>
            <div className="mt-1 grid gap-0.5 text-[13px]">
              <div><span className="text-ink-600">Reference no.:</span> <b className="font-mono">{pendingPayment.gatewayRef}</b></div>
              <div><span className="text-ink-600">Sender name:</span> <b>{pendingPayment.senderName ?? "—"}</b></div>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Open your GCash app → Transactions and match the reference number and amount, then confirm.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => call({ action: "verify", paymentId: pendingPayment.id })} disabled={loading} className="btn btn-green flex-1 disabled:opacity-60">
              <SealCheckIcon size={16} weight="fill" /> Payment received
            </button>
            <button onClick={() => call({ action: "reject", paymentId: pendingPayment.id })} disabled={loading} className="btn btn-outline">
              <XCircleIcon size={16} /> Not found
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-ink-600">
            Awaiting the tourist&apos;s GCash reference ({peso(reservationDue)}) — or record a cash payment made at the
            Treasurer&apos;s Office:
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="Official Receipt no."
              className="flex-1 rounded-btn border border-line px-3 py-2 text-sm"
            />
            <button onClick={() => call({ action: "treasurer", bookingCode, orNumber })} disabled={loading} className="btn btn-green disabled:opacity-60">
              <BankIcon size={16} weight="duotone" /> Record cash
            </button>
          </div>
        </>
      )}

      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
    </section>
  );
}
