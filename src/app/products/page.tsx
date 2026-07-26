import { BasketIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.localProduct.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Local Products of Bagulin</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">Handcrafted and produced by local farmers and cooperatives — available at the Pasalubong Center.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((pr) => (
            <div key={pr.id} className="card">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-[#d7ead8]">
                <BasketIcon size={40} weight="duotone" className="text-brand-700" />
              </div>
              <div className="p-4">
                <span className="pill mb-1 bg-brand-100 text-brand-700">{pr.category}</span>
                <h4 className="font-display text-[15px] font-bold">{pr.name}</h4>
                <p className="mt-1 text-[13px] text-ink-600">{pr.description}</p>
                <div className="mt-2 text-xs font-semibold text-ink-900">By {pr.producer}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
