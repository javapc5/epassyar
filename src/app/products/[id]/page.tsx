import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  StarIcon,
  StorefrontIcon,
  MapPinIcon,
  PackageIcon,
  ClockIcon,
  UserIcon,
  BasketIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, unitPrice, productAvailability, isMediaUrl } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PhotoGallery from "@/components/PhotoGallery";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  ok: "bg-ok/15 text-ok",
  warn: "bg-amber-100 text-amber-800",
  off: "bg-gray-100 text-gray-500",
};

// How each mode reads to the buyer, independent of a specific pickup date.
const MODE_META: Record<string, { label: string; blurb: string }> = {
  always: { label: "Available anytime", blurb: "Kept in stock at the Tourism Office year-round — order for any visit date." },
  in_stock: { label: "In stock", blurb: "A limited quantity is on hand. Reserve early — stock is first-come." },
  made_to_order: { label: "Made to order", blurb: "Sourced fresh from the producer once you order, so it needs a few days' notice before your visit." },
  unavailable: { label: "Currently unavailable", blurb: "Not being offered right now. Check back on a later visit." },
};

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const p = await prisma.localProduct.findUnique({ where: { id: numId } });
  if (!p) notFound();

  const avail = productAvailability(p);
  const mode = MODE_META[p.availabilityMode] ?? MODE_META.in_stock;

  return (
    <>
      <SiteHeader />

      <div className="relative h-64 sm:h-72">
        {isMediaUrl(p.image) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image!} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-[#d7ead8]">
            <BasketIcon size={72} weight="duotone" className="text-brand-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-0 pb-5 text-white">
          <Link href="/products" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold opacity-90 hover:opacity-100">
            <ArrowLeftIcon size={15} /> All products
          </Link>
          <h1 className="font-display text-[1.75rem] font-extrabold drop-shadow-lg">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 drop-shadow">
            {p.category && <span>{p.category}</span>}
            {p.ratingCount > 0 && (
              <span className="inline-flex items-center gap-0.5 font-semibold">
                <StarIcon size={15} weight="fill" className="text-cta-400" /> {p.ratingAvg.toFixed(1)}
                <span className="font-normal opacity-80">({p.ratingCount})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="wrap grid gap-8 py-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {p.description && <p className="text-[15px] leading-relaxed text-ink-900">{p.description}</p>}

          {/* Availability — the buyer's overview of how this product is supplied */}
          <div className="mt-6 rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-bold">Availability</h3>
              <span className={`pill ${TONE[avail.tone]}`}>{avail.label}</span>
            </div>
            <div className="mt-1 font-semibold text-brand-700">{mode.label}</div>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-600">{mode.blurb}</p>

            {p.availabilityMode === "made_to_order" && p.leadTimeDays > 0 && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#fff3d6] px-3 py-2 text-[12.5px] font-semibold text-[#8a6100]">
                <ClockIcon size={14} weight="fill" className="mt-px shrink-0" />
                Order at least {p.leadTimeDays} day{p.leadTimeDays > 1 ? "s" : ""} before your visit so the producer can prepare it.
              </div>
            )}
            {p.availabilityMode === "in_stock" && p.stockQty > 0 && p.stockQty <= 5 && (
              <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] font-semibold text-amber-800">
                <PackageIcon size={14} weight="fill" className="mt-px shrink-0" />
                Only {p.stockQty} left in stock.
              </div>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact icon={<BasketIcon size={20} weight="duotone" />} label="Sold by" value={`per ${p.unit}`} />
            <Fact icon={<StorefrontIcon size={20} weight="duotone" />} label="Price" value={unitPrice(p.price, p.unit)} />
            {p.producer && <Fact icon={<UserIcon size={20} weight="duotone" />} label="Producer" value={p.producer} />}
            {p.whereToBuy && <Fact icon={<MapPinIcon size={20} weight="duotone" />} label="Where to buy" value={p.whereToBuy} />}
          </div>

          {/* Browsable product photos — opens a full-screen lightbox */}
          <PhotoGallery entityType="product" entityId={p.id} title="More photos" />
        </div>

        <aside className="h-fit rounded-card border border-line bg-white p-5 shadow-card">
          <div className="text-sm text-ink-600">Price</div>
          <div className="mt-1 font-display text-3xl font-extrabold text-brand-700">{peso(p.price)}</div>
          <div className="text-sm font-semibold text-ink-600">per {p.unit}</div>

          <div className={`mt-4 rounded-lg px-3 py-2 text-center text-[13px] font-bold ${TONE[avail.tone]}`}>
            {avail.label}
          </div>

          <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700">
            <StorefrontIcon size={14} weight="fill" className="mr-1 inline text-brand-700" />
            Reserve and pay in advance from your booking, then pick up at the Municipal Tourism Office on your visit day.
          </div>

          <Link href="/my-booking" className="btn btn-amber mt-4 w-full">
            Reserve with your booking
          </Link>
          <div className="mt-2 text-center text-[11px] text-ink-600">
            Products are ordered from your booking page. Don&apos;t have one yet? Plan a visit first.
          </div>
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
