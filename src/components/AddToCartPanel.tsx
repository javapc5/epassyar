"use client";

import { useState } from "react";
import Link from "next/link";
import { MinusIcon, PlusIcon, ShoppingCartSimpleIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useCart } from "./CartProvider";

/** Quantity stepper + add-to-cart action for the product detail page. */
export default function AddToCartPanel({
  product,
  disabled,
  disabledLabel = "Currently unavailable",
}: {
  product: { id: number; name: string; image: string | null; price: number; unit: string };
  disabled?: boolean;
  disabledLabel?: string;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId: product.id, name: product.name, image: product.image, price: product.price, unit: product.unit }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (disabled) {
    return (
      <button type="button" disabled className="btn btn-outline mt-4 w-full cursor-not-allowed justify-center opacity-50">
        {disabledLabel}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-btn border border-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-9 items-center justify-center text-ink-700 hover:bg-ink-100"
            aria-label="Decrease quantity"
          >
            <MinusIcon size={14} weight="bold" />
          </button>
          <span className="w-7 text-center text-sm font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-10 w-9 items-center justify-center text-ink-700 hover:bg-ink-100"
            aria-label="Increase quantity"
          >
            <PlusIcon size={14} weight="bold" />
          </button>
        </div>
        <button type="button" onClick={handleAdd} className={`btn ${added ? "btn-green" : "btn-amber"} flex-1 justify-center`}>
          {added ? (
            <>
              <CheckCircleIcon size={16} weight="fill" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingCartSimpleIcon size={16} weight="bold" /> Add to Cart
            </>
          )}
        </button>
      </div>
      {added && (
        <Link href="/cart" className="mt-2 block text-center text-[12.5px] font-semibold text-brand-700 hover:underline">
          View cart →
        </Link>
      )}
    </div>
  );
}
