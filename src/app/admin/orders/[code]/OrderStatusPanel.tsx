"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageIcon, HandshakeIcon, XCircleIcon } from "@phosphor-icons/react";

/** Admin: move a paid product order through fulfillment, or cancel it. */
export default function OrderStatusPanel({ orderCode, orderStatus }: { orderCode: string; orderStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function call(action: string) {
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/product-orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, orderCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Action failed.");
    router.refresh();
  }

  const canCancel = !["picked_up", "cancelled"].includes(orderStatus);

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 font-display text-[15px] font-bold">Fulfillment</h2>
      <div className="flex flex-col gap-2">
        {orderStatus === "paid" && (
          <button onClick={() => call("mark_ready")} disabled={loading} className="btn btn-green disabled:opacity-60">
            <PackageIcon size={16} weight="duotone" /> Mark ready for pickup
          </button>
        )}
        {(orderStatus === "paid" || orderStatus === "ready_for_pickup") && (
          <button onClick={() => call("mark_picked_up")} disabled={loading} className="btn btn-green disabled:opacity-60">
            <HandshakeIcon size={16} weight="duotone" /> Mark picked up
          </button>
        )}
        {canCancel && (
          <button onClick={() => call("cancel")} disabled={loading} className="btn btn-outline disabled:opacity-60">
            <XCircleIcon size={16} /> Cancel order
          </button>
        )}
      </div>
      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
    </section>
  );
}
