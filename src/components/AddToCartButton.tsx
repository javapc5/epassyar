"use client";

import { useState } from "react";
import { PlusIcon, CheckIcon } from "@phosphor-icons/react";
import { useCart } from "./CartProvider";

/** Compact add-to-cart control used on product cards. */
export default function AddToCartButton({
  product,
  disabled,
  disabledLabel = "Unavailable",
  className,
}: {
  product: { id: number; name: string; image: string | null; price: number; unit: string };
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    addItem({ productId: product.id, name: product.name, image: product.image, price: product.price, unit: product.unit });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`btn ${added ? "btn-green" : "btn-outline"} !px-3 !py-1.5 text-[12.5px] disabled:cursor-not-allowed disabled:border-line disabled:bg-ink-100 disabled:text-ink-400 ${className ?? ""}`}
    >
      {disabled ? (
        disabledLabel
      ) : added ? (
        <>
          <CheckIcon size={13} weight="bold" /> Added
        </>
      ) : (
        <>
          <PlusIcon size={13} weight="bold" /> Add to cart
        </>
      )}
    </button>
  );
}
