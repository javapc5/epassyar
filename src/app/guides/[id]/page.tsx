import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinIcon, StarIcon, CalendarCheckIcon, MedalIcon, ArrowLeftIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { parseList, isMediaUrl } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

export default async function GuideDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await prisma.tourGuide.findUnique({ where: { id: Number(id) } });
  if (!g) notFound();

  const specialties = parseList(g.specialties);
  const initials = g.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const colors = ["#2e7d32", "#0277BD", "#8a6100", "#6a1b9a", "#00695c"];
  const color = colors[g.id % colors.length];
  const hasPhoto = isMediaUrl(g.photoUrl);

  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <Link href="/guides" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeftIcon size={15} /> All guides
        </Link>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Portrait full-body photo (3:4) */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-line bg-brand-100 shadow-card">
              {hasPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.photoUrl!} alt={g.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-700" style={{ background: `${color}18` }}>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-extrabold text-white" style={{ background: color }}>{initials}</div>
                  <span className="flex items-center gap-1 text-xs font-semibold"><UserIcon size={13} /> Photo coming soon</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <h1 className="font-display text-2xl font-extrabold">{g.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-600">
              <span className="inline-flex items-center gap-1"><MapPinIcon size={16} /> Brgy. {g.barangay}</span>
              {g.accreditationNo && <span className="text-sm">· Accreditation {g.accreditationNo}</span>}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {specialties.length ? specialties.map((s) => <span key={s} className="chip">{s}</span>) : <span className="chip">Community guide</span>}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat icon={<StarIcon size={20} weight="fill" className="text-cta-700" />} label="Rating" value={g.ratingCount > 0 ? `${g.ratingAvg.toFixed(1)} (${g.ratingCount})` : "New"} />
              <Stat icon={<MedalIcon size={20} weight="duotone" className="text-brand-700" />} label="Experience" value={`${g.yearsExperience} yr${g.yearsExperience === 1 ? "" : "s"}`} />
              <Stat icon={<CalendarCheckIcon size={20} weight="duotone" className="text-brand-700" />} label="Status" value="Available" />
            </div>

            <h2 className="mt-6 font-display text-lg font-bold">About</h2>
            <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-900">
              {g.bio?.trim() || `${g.fullName} is an accredited community tour guide from Brgy. ${g.barangay}, ready to lead your Bagulin adventure.`}
            </p>
          </div>
        </div>

        <PhotoGallery entityType="guide" entityId={g.id} title="Tour photos" />

        <div className="mt-6 rounded-card border border-line bg-brand-100 p-4 text-sm text-brand-700">
          Guides are assigned by the Tourism Office when your booking is approved, based on availability, barangay proximity to your destinations, and specialty. You&apos;ll see your assigned guide on your QR tourist pass.
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-3 text-center shadow-card">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-600">{label}</div>
      <div className="font-display text-[15px] font-bold">{value}</div>
    </div>
  );
}
