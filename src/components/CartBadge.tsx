"use client";

import Link from "next/link";
import { ShoppingCartSimpleIcon } from "@phosphor-icons/react";
import { useCart } from "./CartProvider";

export default function CartBadge() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart${count > 0 ? `, ${count} item${count > 1 ? "s" : ""}` : ""}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line/80 bg-white text-ink-700 shadow-sm transition-colors hover:bg-brand-50"
    >
      <ShoppingCartSimpleIcon size={18} weight="bold" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta-500 px-1 text-[9px] font-extrabold text-cta-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
