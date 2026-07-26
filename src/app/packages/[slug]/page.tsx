import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, parseList } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

export default async function PackageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.tourPackage.findUnique({
    where: { slug },
    include: { destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } } },
  });
  if (!p) notFound();

  const inclusions = parseList(p.inclusions) as any[];
  const kind = p.mainImage?.includes("heritage") ? "cave" : p.mainImage?.includes("adventure") ? "adventure" : "falls";

  return (
    <>
      <SiteHeader />
      <div className="relative h-72">
        <Photo src={p.mainImage} kind={kind} alt={p.name} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-0 pb-5 text-white">
          <Link href="/packages" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold opacity-90 hover:opacity-100">
            <ArrowLeftIcon size={15} /> All packages
          </Link>
          <span className="pill bg-black/55">{p.durationLabel}</span>
          <h1 className="mt-2 font-display text-[1.75rem] font-extrabold drop-shadow-lg">{p.name}</h1>
        </div>
      </div>

      <main className="wrap py-8">
        <div className="max-w-3xl">
          <p className="text-[15px] leading-relaxed">{p.description}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900"><ClockIcon size={17} weight="duotone" /> {p.durationLabel}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900"><UsersIcon size={17} weight="duotone" /> {p.minPax}–{p.maxPax} pax</span>
          </div>

          <h3 className="mt-6 font-display text-lg font-bold">Destinations included</h3>
          <div className="mt-2 space-y-2">
            {p.destinations.map((pd, i) => (
              <Link key={pd.id} href={`/destinations/${pd.destination.id}`} className="flex items-center gap-3 rounded-card border border-line bg-white p-3 hover:shadow-card">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{i + 1}</span>
                <div>
                  <div className="font-display text-[15px] font-bold">{pd.destination.name}</div>
                  <div className="flex items-center gap-1 text-xs text-ink-600"><MapPinIcon size={12} /> Brgy. {pd.destination.barangay}</div>
                </div>
              </Link>
            ))}
          </div>

          {p.itineraryNotes && (
            <>
              <h3 className="mt-6 font-display text-lg font-bold">Day plan</h3>
              <p className="mt-1 text-[14px] text-ink-900">{p.itineraryNotes}</p>
            </>
          )}

          <h3 className="mt-6 font-display text-lg font-bold">Inclusions</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {inclusions.map((inc: any) => (
              <div key={inc.label} className="flex items-center gap-2 text-sm">
                {inc.included ? <CheckCircleIcon size={18} weight="fill" className="text-ok" /> : <XCircleIcon size={18} weight="fill" className="text-ink-600" />}
                <span className={inc.included ? "" : "text-ink-600 line-through"}>{inc.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <span className="text-[13px] text-ink-600">From</span>
              <div className="font-display text-2xl font-extrabold text-brand-700">
                {peso(p.pricePerPax)}<span className="text-sm font-semibold text-ink-600"> / person</span>
              </div>
              <span className="text-[12px] text-ink-600">{p.minPax}–{p.maxPax} pax</span>
            </div>
            <Link href="/build" className="btn btn-amber w-full justify-center sm:w-auto">
              Plan a Visit <ArrowRightIcon size={14} weight="bold" />
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
