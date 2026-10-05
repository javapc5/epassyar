import Link from "next/link";
import { PhoneIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { TopoLines } from "./decor/NatureDecor";
import EpassyarMark from "./EpassyarMark";

const EXPLORE = [
  { href: "/destinations", label: "Destinations" },
  { href: "/packages", label: "Tour Packages" },
  { href: "/guides", label: "Tour Guides" },
];

const PLAN = [
  { href: "/build", label: "Build Your Itinerary" },
  { href: "/stay", label: "Where to Stay" },
  { href: "/products", label: "Local Products" },
];

const OFFICE = [
  { href: "/my-booking", label: "Track My Booking" },
  { href: "/admin", label: "Admin Panel" },
];

export default async function SiteFooter() {
  const muni = await prisma.municipality.findUnique({ where: { id: 1 } });
  const name = muni?.name ?? "Bagulin";

  return (
    <footer className="relative mt-14 overflow-hidden bg-ink-900 text-[#B4B9C0]">
      <TopoLines className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]" />

      <div className="wrap relative grid gap-8 py-10 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <EpassyarMark size={30} tone="reversed" className="shrink-0" />
            <div className="leading-tight">
              <div className="font-wordmark text-[16px] text-white">epassyar</div>
              <div className="text-[11px]">{name} Smart Tourism</div>
            </div>
          </div>
          {muni?.tagline && (
            <p className="mt-3 text-[12px] leading-relaxed text-[#9CA3AB]">{muni.tagline}</p>
          )}
          <div className="mt-4 flex flex-col gap-1.5 text-[12px]">
            {muni?.contactNumber && (
              <span className="inline-flex items-center gap-1.5">
                <PhoneIcon size={12} /> {muni.contactNumber}
              </span>
            )}
            {muni?.email && (
              <span className="inline-flex items-center gap-1.5">
                <EnvelopeSimpleIcon size={12} /> {muni.email}
              </span>
            )}
            {muni?.address && (
              <span className="text-[11.5px] text-[#9CA3AB]">{muni.address}</span>
            )}
          </div>
        </div>

        {/* Explore */}
        <FooterCol title="Explore">
          {EXPLORE.map((l) => <FooterLink key={l.href} {...l} />)}
        </FooterCol>

        {/* Plan & Stay */}
        <FooterCol title="Plan & Stay">
          {PLAN.map((l) => <FooterLink key={l.href} {...l} />)}
        </FooterCol>

        {/* Office */}
        <FooterCol title="Office">
          {OFFICE.map((l) => <FooterLink key={l.href} {...l} />)}
        </FooterCol>
      </div>

      <div className="relative border-t border-white/10 py-3 text-center text-[11px] text-[#7D838B]">
        © {new Date().getFullYear()} {name}{muni?.province ? `, ${muni.province}` : ""} · Accommodations listed are recommendations only and not bookable online.
        <span className="mx-2 opacity-40">·</span>Powered by{" "}
        <span className="inline-flex items-center gap-1 align-middle">
          <EpassyarMark size={14} tone="reversed" className="shrink-0" />
          <span className="font-wordmark text-[#9CA3AB]">epassyar</span>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">{title}</h4>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-[13px] transition-colors hover:text-white">
        {label}
      </Link>
    </li>
  );
}
