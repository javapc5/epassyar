"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCartSimpleIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import { peso } from "@/lib/format";

/** Turns the browser's cart into a real ProductOrder tied to this booking. */
export default function CartCheckoutPanel({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) return null;

  async function checkout() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/products/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookingCode,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Checkout failed.");
    clear();
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-card border-2 border-brand-200 bg-brand-50/50 p-5">
      <div className="flex items-center gap-2 font-display text-lg font-bold">
        <ShoppingCartSimpleIcon size={20} weight="bold" className="text-brand-700" /> Checkout your cart
      </div>
      <p className="mt-1 text-sm text-ink-600">
        {items.length} item{items.length > 1 ? "s" : ""} from local producers, ready to pick up on your visit.
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-[13.5px]">
            <span>{i.qty} × {i.name}</span>
            <b>{peso(i.price * i.qty)}</b>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t border-dashed border-line pt-2 font-display text-base font-extrabold">
        <span>Total</span><span>{peso(subtotal)}</span>
      </div>
      {error && <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-danger">{error}</div>}
      <button onClick={checkout} disabled={loading} className="btn btn-amber mt-3 w-full disabled:opacity-60">
        {loading ? "Placing order…" : <>Place order — pay in full <ArrowRightIcon size={15} weight="bold" /></>}
      </button>
    </div>
  );
}
