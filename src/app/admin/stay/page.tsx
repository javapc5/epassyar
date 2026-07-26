import Link from "next/link";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStay() {
  const stays = await prisma.accommodation.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Homestays & Cottages</h1>
          <p className="text-sm text-ink-600">Recommendation listings only — never part of the payment system. Hosts are contacted directly.</p>
        </div>
        <Link href="/admin/stay/new" className="btn btn-amber"><PlusIcon size={16} weight="bold" /> Add listing</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Barangay</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Price range</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {stays.map((s) => (
              <tr key={s.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3 font-semibold">
                  <div className="flex items-center gap-2">
                    {s.image?.startsWith("/uploads/") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" className="h-8 w-12 rounded object-cover" />
                    )}
                    {s.name}
                  </div>
                </td>
                <td className="p-3 capitalize">{s.type}</td>
                <td className="p-3">{s.barangay}</td>
                <td className="p-3">{s.contactNumber ?? "—"}</td>
                <td className="p-3">{s.priceRange ?? "—"}</td>
                <td className="p-3"><span className={`pill ${s.status === "active" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{s.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/stay/${s.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                    <PencilSimpleIcon size={14} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
