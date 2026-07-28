import Link from "next/link";
import { BasketIcon, StarIcon, TrendUpIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { unitPrice, productAvailability, isMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  ok: "bg-ok/15 text-ok",
  warn: "bg-amber-100 text-amber-800",
  off: "bg-gray-100 text-gray-500",
};

export default async function ProductsPage() {
  const products = await prisma.localProduct.findMany({ orderBy: { id: "asc" } });

  // Trending: admin-picked featured items first (by rank), then filled out by
  // sales so the strip is never empty even before anyone sets the flag.
  const featured = products
    .filter((p) => p.isFeatured && p.status === "available")
    .sort((a, b) => a.featuredRank - b.featuredRank);
  const trending = (featured.length ? featured : [...products].sort((a, b) => b.soldCount - a.soldCount))
    .slice(0, 3);
  const trendingIds = new Set(trending.map((p) => p.id));
  const rest = products.filter((p) => !trendingIds.has(p.id));

  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Local Products of Bagulin</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">
          Sourced from local farmers and cooperatives through the Tourism Office. Order ahead and pick up on your visit.
        </p>

        {/* ─── Trending showcase ─────────────────────────────────────────── */}
        {trending.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow">
                <TrendUpIcon size={13} weight="bold" /> Trending in Bagulin
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {trending.map((pr, i) => {
                const avail = productAvailability(pr);
                return (
                  <Link
                    href={`/products/${pr.id}`}
                    key={pr.id}
                    className={`card card-hover relative flex flex-col ${i === 0 ? "sm:col-span-1 ring-1 ring-brand-200" : ""}`}
                  >
                    <span className="pill absolute left-3 top-3 z-10 bg-cta-500 text-cta-ink shadow-sm">
                      <SparkleIcon size={12} weight="fill" /> Featured
                    </span>
                    <div className="flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-[#d7ead8]">
                      {isMediaUrl(pr.image) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pr.image!} alt={pr.name} className="h-full w-full object-cover" />
                      ) : (
                        <BasketIcon size={48} weight="duotone" className="text-brand-700" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      {pr.category && <span className="pill mb-1 w-fit bg-brand-100 text-brand-700">{pr.category}</span>}
                      <h4 className="font-display text-[15px] font-bold">{pr.name}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-600">
                        {pr.ratingCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-ink-900">
                            <StarIcon size={12} weight="fill" className="text-cta-500" /> {pr.ratingAvg.toFixed(1)}
                            <span className="font-normal text-ink-500">({pr.ratingCount})</span>
                          </span>
                        )}
                        {pr.producer && <span className="truncate">· {pr.producer}</span>}
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="font-display text-base font-extrabold text-brand-700">{unitPrice(pr.price, pr.unit)}</span>
                        <span className={`pill ${TONE[avail.tone]}`}>{avail.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Full catalog ──────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold">All Products</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((pr) => {
              const avail = productAvailability(pr);
              return (
                <Link href={`/products/${pr.id}`} key={pr.id} className="card card-hover flex flex-col">
                  <div className="flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-[#d7ead8]">
                    {isMediaUrl(pr.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pr.image!} alt={pr.name} className="h-full w-full object-cover" />
                    ) : (
                      <BasketIcon size={40} weight="duotone" className="text-brand-700" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {pr.category && <span className="pill mb-1 w-fit bg-brand-100 text-brand-700">{pr.category}</span>}
                    <h4 className="font-display text-[15px] font-bold">{pr.name}</h4>
                    {pr.description && <p className="mt-1 line-clamp-2 text-[13px] text-ink-600">{pr.description}</p>}
                    {pr.ratingCount > 0 && (
                      <div className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-ink-900">
                        <StarIcon size={12} weight="fill" className="text-cta-500" /> {pr.ratingAvg.toFixed(1)}
                        <span className="font-normal text-ink-500">({pr.ratingCount})</span>
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="font-display text-[15px] font-extrabold text-brand-700">{unitPrice(pr.price, pr.unit)}</span>
                      <span className={`pill ${TONE[avail.tone]}`}>{avail.label}</span>
                    </div>
                    {pr.producer && <div className="mt-2 text-xs text-ink-500">By {pr.producer}</div>}
                  </div>
                </Link>
              );
            })}
          </div>
          {rest.length === 0 && trending.length === 0 && (
            <p className="mt-4 text-sm text-ink-600">No products listed yet.</p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
