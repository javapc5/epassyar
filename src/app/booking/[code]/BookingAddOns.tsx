import Link from "next/link";
import { BasketIcon, StarIcon, ArrowRightIcon, StorefrontIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { unitPrice, productAvailability, shortDate, isMediaUrl } from "@/lib/format";

/**
 * Soft product endorsement shown on the booking page — the one screen a tourist
 * reopens repeatedly before the trip. Deliberately placed AFTER the booking is
 * done so it never competes with the primary conversion. Only shows items that
 * can actually be ready by the visit date (harvest lead time respected), and
 * frames pickup around the trip the tourist already has.
 *
 * This is a browse-and-plan prompt, not a checkout — the ordering/payment flow
 * is a separate subsystem. Keep it to a few items: this is a government tourism
 * site, so it endorses gently rather than upsells.
 */
export default async function BookingAddOns({
  municipalityId,
  visitDate,
}: {
  municipalityId: number;
  visitDate: Date;
}) {
  const products = await prisma.localProduct.findMany({
    where: { municipalityId, status: "available" },
  });

  // Ready for this specific trip, best-rated / featured first.
  const ready = products
    .filter((p) => productAvailability(p, visitDate).ok)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.soldCount - a.soldCount || b.ratingAvg - a.ratingAvg)
    .slice(0, 3);

  if (ready.length === 0) return null;

  return (
    <section className="mt-6 rounded-card border border-brand-100 bg-brand-50/40 p-5">
      <div className="flex items-center gap-2">
        <StorefrontIcon size={20} weight="duotone" className="text-brand-700" />
        <h3 className="font-display text-lg font-bold">Take home a taste of Bagulin</h3>
      </div>
      <p className="mt-1 text-[13px] text-ink-600">
        Local products you can reserve now and pick up at the Tourism Office on <b>{shortDate(visitDate)}</b> — one trip, nothing to carry around.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {ready.map((pr) => (
          <div key={pr.id} className="card flex flex-col">
            <div className="flex h-24 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-[#d7ead8]">
              {isMediaUrl(pr.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pr.image!} alt={pr.name} className="h-full w-full object-cover" />
              ) : (
                <BasketIcon size={32} weight="duotone" className="text-brand-700" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h4 className="font-display text-[14px] font-bold leading-tight">{pr.name}</h4>
              {pr.ratingCount > 0 && (
                <div className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-ink-900">
                  <StarIcon size={11} weight="fill" className="text-cta-500" /> {pr.ratingAvg.toFixed(1)}
                </div>
              )}
              <div className="mt-auto pt-2 font-display text-sm font-extrabold text-brand-700">{unitPrice(pr.price, pr.unit)}</div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/products"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline"
      >
        Browse all local products <ArrowRightIcon size={15} weight="bold" />
      </Link>
    </section>
  );
}
