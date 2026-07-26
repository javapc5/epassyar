import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPinIcon,
  PersonSimpleHikeIcon,
  ClockIcon,
  MountainsIcon,
  TicketIcon,
  UsersIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, parseList } from "@/lib/format";
import { remainingCapacity } from "@/lib/availability";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Photo from "@/components/Photo";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

export default async function DestinationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.destination.findUnique({ where: { id: Number(id) } });
  if (!d) notFound();

  const acts = parseList(d.activities);
  const remaining = await remainingCapacity(d.id, new Date());

  return (
    <>
      <SiteHeader />
      <div className="relative h-72">
        <Photo src={d.mainImage} kind={d.category} alt={d.name} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-0 pb-5 text-white">
          <Link href="/destinations" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold opacity-90 hover:opacity-100">
            <ArrowLeftIcon size={15} /> All destinations
          </Link>
          <h1 className="font-display text-[1.75rem] font-extrabold drop-shadow-lg">{d.name}</h1>
          <div className="mt-1 flex items-center gap-2 drop-shadow">
            <MapPinIcon size={16} /> Brgy. {d.barangay} · {d.category}
          </div>
        </div>
      </div>

      <main className="wrap grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="text-[15px] leading-relaxed text-ink-900">{d.description}</p>

          <h3 className="mt-6 font-display text-lg font-bold">Activities</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {acts.map((a) => (
              <span key={a} className="chip">{a}</span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact icon={<MountainsIcon size={20} weight="duotone" />} label="Difficulty" value={cap(d.difficulty)} />
            {d.trekkingDuration && <Fact icon={<ClockIcon size={20} weight="duotone" />} label="Trek time" value={d.trekkingDuration} />}
            <Fact icon={<PersonSimpleHikeIcon size={20} weight="duotone" />} label="Guide" value={d.guideRequired ? "Required" : "Optional"} />
            <Fact icon={<TicketIcon size={20} weight="duotone" />} label="Entrance" value={d.entranceFee > 0 ? peso(d.entranceFee) : "Free"} />
            <Fact icon={<UsersIcon size={20} weight="duotone" />} label="Daily capacity" value={`${d.dailyCapacity} pax`} />
            <Fact icon={<ClockIcon size={20} weight="duotone" />} label="Open" value={`${d.openTime}–${d.closeTime}`} />
          </div>

          <PhotoGallery entityType="destination" entityId={d.id} />
        </div>

        <aside className="h-fit rounded-card border border-line bg-white p-5 shadow-card">
          <div className="text-sm text-ink-600">Availability today</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-brand-700">
            {remaining} <span className="text-sm font-semibold text-ink-600">of {d.dailyCapacity} slots left</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand-500" style={{ width: `${(remaining / d.dailyCapacity) * 100}%` }} />
          </div>
          {d.guideRequired && (
            <div className="mt-4 rounded-lg bg-[#fff3d6] px-3 py-2 text-[12.5px] font-semibold text-[#8a6100]">
              <PersonSimpleHikeIcon size={14} weight="fill" className="mr-1 inline" />
              An accredited guide is required and will be assigned to your booking.
            </div>
          )}
          <Link href={`/build?add=${d.id}`} className="btn btn-amber mt-4 w-full">Add to itinerary</Link>
          <div className="mt-2 text-center text-[11px] text-ink-600">Build a full itinerary and see all fees before paying.</div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-3">
      <div className="text-brand-700">{icon}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-600">{label}</div>
      <div className="font-display text-[15px] font-bold">{value}</div>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
