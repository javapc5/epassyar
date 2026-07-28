import Link from "next/link";
import { PlusIcon, PencilSimpleIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, unitPrice, isMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

const MODE_LABEL: Record<string, string> = {
  always: "Always",
  in_stock: "In stock",
  made_to_order: "Made to order",
  unavailable: "Unavailable",
};

export default async function AdminProducts() {
  const products = await prisma.localProduct.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Local Products</h1>
          <p className="text-sm text-ink-600">Add products, upload photos, and set pricing & availability — changes appear on the public site immediately.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-amber"><PlusIcon size={16} weight="bold" /> Add product</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Availability</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3 font-semibold">
                  <div className="flex items-center gap-2">
                    {isMediaUrl(p.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image ?? undefined} alt="" className="h-8 w-12 rounded object-cover" />
                    ) : (
                      <span className="flex h-8 w-12 items-center justify-center rounded bg-ink-100 text-[10px] text-ink-500">No photo</span>
                    )}
                    {p.name}
                  </div>
                </td>
                <td className="p-3">{p.category ?? "—"}</td>
                <td className="p-3">{unitPrice(p.price, p.unit)}{p.costPrice > 0 && <span className="ml-1 text-xs text-ink-500">(cost {peso(p.costPrice)})</span>}</td>
                <td className="p-3">
                  {MODE_LABEL[p.availabilityMode] ?? p.availabilityMode}
                  {p.availabilityMode === "in_stock" && <span className="ml-1 text-xs text-ink-500">· {p.stockQty} left</span>}
                  {p.availabilityMode === "made_to_order" && <span className="ml-1 text-xs text-ink-500">· {p.leadTimeDays}d notice</span>}
                </td>
                <td className="p-3">
                  {p.isFeatured ? <span className="pill bg-cta-500 text-cta-ink"><StarIcon size={11} weight="fill" /> #{p.featuredRank}</span> : <span className="text-ink-400">—</span>}
                </td>
                <td className="p-3"><span className={`pill ${p.status === "available" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                    <PencilSimpleIcon size={14} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-ink-600">No products yet — add your first one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
