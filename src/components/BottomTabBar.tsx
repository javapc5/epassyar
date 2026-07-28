"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseIcon,
  MountainsIcon,
  BasketIcon,
  TicketIcon,
} from "@phosphor-icons/react";

/**
 * Mobile-only bottom tab bar. Keeps the two pillars — Destinations and Products —
 * one thumb-tap apart at all times, with Home and My Booking either side. Hidden
 * at lg where the header nav takes over. This is the discoverable affordance;
 * deep links keep working, unlike a swipe-only switch.
 */
const TABS = [
  { href: "/", label: "Home", icon: HouseIcon, match: (p: string) => p === "/" },
  { href: "/destinations", label: "Explore", icon: MountainsIcon, match: (p: string) => p.startsWith("/destinations") || p.startsWith("/packages") || p.startsWith("/guides") },
  { href: "/products", label: "Products", icon: BasketIcon, match: (p: string) => p.startsWith("/products") },
  { href: "/my-booking", label: "My Trip", icon: TicketIcon, match: (p: string) => p.startsWith("/my-booking") || p.startsWith("/booking") },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-bg/90 backdrop-blur-lg supports-[backdrop-filter]:bg-bg/75 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                active ? "text-brand-700" : "text-ink-500 hover:text-brand-600"
              }`}
            >
              <Icon size={22} weight={active ? "fill" : "regular"} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
