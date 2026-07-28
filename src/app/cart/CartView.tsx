"use client";

import Link from "next/link";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartSimpleIcon,
  ArrowRightIcon,
  BasketIcon,
} from "@phosphor-icons/react";
import { useCart } from "@/components/CartProvider";
import { peso, unitPrice } from "@/lib/format";

export default function CartView() {
  const { items, subtotal, setQty, removeItem, clear } = useCart();

  if (items.length === 0) {
    return (
      <main className="wrap py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <ShoppingCartSimpleIcon size={28} weight="duotone" />
        </div>
        <h1 className="mt-4 font-display text-xl font-extrabold">Your cart is empty</h1>
        <p className="mx-auto mt-1 max-w-sm text-[13.5px] text-ink-600">
          Add local products while you browse — they&apos;ll be waiting here when you&apos;re ready.
        </p>
        <Link href="/products" className="btn btn-amber mt-5">
          Browse Local Products <ArrowRightIcon size={15} weight="bold" />
        </Link>
      </main>
    );
  }

  return (
    <main className="wrap py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Your Cart</h1>
        <button type="button" onClick={clear} className="text-[12.5px] font-semibold text-ink-500 hover:text-danger">
          Clear cart
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.productId} className="card flex items-center gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-ink-100 to-[#E1E4E8]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BasketIcon size={22} weight="duotone" className="text-ink-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.productId}`} className="font-display text-[14px] font-bold leading-tight hover:underline">
                  {item.name}
                </Link>
                <div className="mt-0.5 text-[12.5px] text-ink-600">{unitPrice(item.price, item.unit)}</div>
              </div>
              <div className="flex shrink-0 items-center rounded-btn border border-line">
                <button
                  type="button"
                  onClick={() => setQty(item.productId, item.qty - 1)}
                  className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-ink-100"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <MinusIcon size={12} weight="bold" />
                </button>
                <span className="w-7 text-center text-[13px] font-bold">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(item.productId, item.qty + 1)}
                  className="flex h-8 w-8 items-center justify-center text-ink-700 hover:bg-ink-100"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  <PlusIcon size={12} weight="bold" />
                </button>
              </div>
              <div className="w-16 shrink-0 text-right font-display text-[14px] font-extrabold text-brand-700">
                {peso(item.price * item.qty)}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="shrink-0 text-ink-400 hover:text-danger"
                aria-label={`Remove ${item.name} from cart`}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        <aside className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-600">Subtotal</span>
            <span className="font-display text-lg font-extrabold">{peso(subtotal)}</span>
          </div>
          <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
            <ShoppingCartSimpleIcon size={14} weight="fill" className="mr-1 inline text-brand-700" />
            Nothing is charged yet. Continue to your booking to reserve and pay for these items, then pick them up at the Tourism Office on your visit day.
          </div>
          <Link href="/my-booking" className="btn btn-amber mt-4 w-full justify-center">
            Continue to My Booking <ArrowRightIcon size={15} weight="bold" />
          </Link>
          <Link href="/products" className="mt-2 block text-center text-[12.5px] font-semibold text-brand-700 hover:underline">
            Keep browsing
          </Link>
        </aside>
      </div>
    </main>
  );
}
