import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ProductCard } from "@/components/cards";

export const dynamic = "force-dynamic";

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
          Sourced from local farmers and cooperatives. Order ahead and pick up on your visit.
        </p>

        {/* ─── Trending showcase ─────────────────────────────────────────── */}
        {trending.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow">
                <TrendUpIcon size={13} weight="bold" /> Trending in Bagulin
              </span>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {trending.map((pr) => (
                <ProductCard key={pr.id} p={pr} featured />
              ))}
            </div>
          </section>
        )}

        {/* ─── Full catalog ──────────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold">All Products</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((pr) => (
              <ProductCard key={pr.id} p={pr} />
            ))}
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
