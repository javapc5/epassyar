import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MobileNav from "./MobileNav";
import EpassyarMark from "./EpassyarMark";

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
          className="group flex shrink-0 items-center gap-2 font-display text-[15px] font-extrabold text-brand-800"
        >
          {/* ePassyar platform mark only — the municipal seal is shown on the
              home banner and admin sidebar, not the site header. */}
          <EpassyarMark
            size={30}
            className="shrink-0 shadow-sm transition-transform duration-300 group-hover:-rotate-6"
          />
          <span className="leading-none">
            <span className="text-cta-600">e</span>Passyar
            <span className="ml-1.5 hidden text-[11px] font-medium text-ink-500 sm:inline">· {name}</span>
          </span>
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
          {/* Desktop CTA — hidden on mobile (it's inside the drawer) */}
          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
