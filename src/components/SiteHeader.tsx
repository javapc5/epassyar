import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MobileNav from "./MobileNav";
import EpassyarMark from "./EpassyarMark";
import CartBadge from "./CartBadge";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/packages", label: "Tour Packages" },
  { href: "/guides", label: "Tour Guides" },
  { href: "/products", label: "Local Products" },
  { href: "/my-booking", label: "My Booking" },
];

export default async function SiteHeader() {
  const muni = await prisma.municipality.findUnique({ where: { id: 1 } });
  const name = muni?.name ?? "Bagulin";

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/80 backdrop-blur-lg supports-[backdrop-filter]:bg-bg/70">
      <div className="wrap flex h-14 items-center gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-1 text-[19px] text-ink-900"
        >
          {/* ePassyar platform mark only — the logo seal is shown on the
              home banner and admin sidebar, not the site header. The icon
              stands in for the literal "e" — together with the wordmark it
              reads as one word, "epassyar". */}
          <EpassyarMark
            size={28}
            tone="color"
            className="shrink-0 transition-transform duration-300 group-hover:-rotate-6"
          />
          <span className="font-wordmark leading-none">epassyar</span>
          <span className="ml-1.5 hidden text-[11px] font-medium text-ink-500 sm:inline">· {name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-0.5 text-[13px] font-medium text-ink-700 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CartBadge />
          {/* Desktop CTA — hidden on mobile (it's inside the drawer) */}
          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
