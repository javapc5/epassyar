import { HouseLineIcon, PhoneIcon, MapPinIcon, InfoIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GalleryGrid from "@/components/GalleryGrid";

export const dynamic = "force-dynamic";

export default async function StayPage() {
  const [stays, galleryImages] = await Promise.all([
    prisma.accommodation.findMany({ where: { status: "active" }, orderBy: { id: "asc" } }),
    prisma.galleryImage.findMany({ where: { entityType: "accommodation" }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  const galleries = new Map<number, string[]>();
  for (const img of galleryImages) {
    const list = galleries.get(img.entityId) ?? [];
    if (list.length < 10) list.push(img.imageUrl);
    galleries.set(img.entityId, list);
  }
  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Where to Stay</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">Homestays and cottages recommended by our team.</p>

        <div className="mt-4 flex items-start gap-2 rounded-card border border-river-100 bg-[#eaf5fa] p-4 text-[13.5px] text-river-500">
          <InfoIcon size={20} weight="fill" className="mt-0.5 shrink-0" />
          <span>
            <b>Recommendations only.</b> Accommodations are <b>not bookable online</b> and are not part of the
            payment system. Please contact the hosts directly to arrange your stay.
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {stays.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <HouseLineIcon size={24} weight="duotone" />
                </div>
                <div>
                  <h4 className="font-display text-[16px] font-bold">{s.name}</h4>
                  <span className="pill bg-brand-100 text-brand-700">{s.type}</span>
                </div>
              </div>
              <p className="mt-3 text-[13.5px] text-ink-900">{s.description}</p>
              {(galleries.get(s.id) ?? []).length > 0 && (
                <div className="mt-3">
                  <GalleryGrid images={(galleries.get(s.id) ?? []).map((url) => ({ imageUrl: url }))} />
                </div>
              )}
              <div className="mt-3 space-y-1 text-[13px] text-ink-600">
                {s.barangay && <div className="flex items-center gap-1.5"><MapPinIcon size={14} /> Brgy. {s.barangay}</div>}
                {s.contactNumber && <div className="flex items-center gap-1.5"><PhoneIcon size={14} /> {s.contactNumber}</div>}
                {s.priceRange && <div className="font-semibold text-ink-900">{s.priceRange}</div>}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
