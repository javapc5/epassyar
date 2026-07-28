"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, XIcon } from "@phosphor-icons/react";

// Overflow menu only — the bottom tab bar already covers Home, Explore
// (Destinations), Products and My Trip (My Booking), and the "Plan a Visit"
// CTA below covers /build. These are the secondary pages that have nowhere
// else to live on mobile.
const NAV = [
  { href: "/packages", label: "Tour Packages" },
  { href: "/guides", label: "Tour Guides" },
  { href: "/stay", label: "Where to Stay" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — only visible below lg */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/80 bg-white text-ink-700 shadow-sm transition-colors hover:bg-brand-50 lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <XIcon size={18} weight="bold" /> : <ListIcon size={18} weight="bold" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-down drawer */}
      <div
        className={`fixed inset-x-0 top-14 z-50 border-b border-line bg-bg shadow-pop transition-all duration-300 ease-out lg:hidden ${
          open ? "translate-y-0 opacity-100" : "-translate-y-2 pointer-events-none opacity-0"
        }`}
      >
        <nav className="wrap flex flex-col divide-y divide-line/60 py-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center py-3.5 text-[15px] font-medium transition-colors hover:text-brand-700 ${
                pathname === n.href ? "font-semibold text-brand-700" : "text-ink-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <div className="py-3">
            <Link
              href="/build"
              className="btn btn-amber w-full justify-center"
              onClick={() => setOpen(false)}
            >
              Plan a Visit
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
