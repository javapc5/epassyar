import Link from "next/link";
import { MountainsIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import MobileNav from "./MobileNav";
import { isMediaUrl } from "@/lib/format";

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
  const logo = isMediaUrl(muni?.logoUrl) ? muni!.logoUrl : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/80 backdrop-blur-lg supports-[backdrop-filter]:bg-bg/70">
      <div className="wrap flex h-14 items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 font-display text-[15px] font-extrabold text-brand-800"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={`${name} logo`} className="h-8 w-8 object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-canopy text-white shadow-sm ring-1 ring-brand-900/10 transition-transform duration-300 group-hover:-rotate-6">
              <MountainsIcon size={18} weight="duotone" />
            </span>
          )}
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
