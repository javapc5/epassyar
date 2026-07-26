import Link from "next/link";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, parseList } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminGuides() {
  const guides = await prisma.tourGuide.findMany({
    orderBy: { fullName: "asc" },
    include: { _count: { select: { assignments: true } } },
  });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Tour Guides</h1>
          <p className="text-sm text-ink-600">{guides.length} accredited community guides. Edit profiles, photos, rates, and duty settings.</p>
        </div>
        <Link href="/admin/guides/new" className="btn btn-amber"><PlusIcon size={16} weight="bold" /> Add guide</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Guide</th>
              <th className="p-3">Barangay</th>
              <th className="p-3">Specialties</th>
              <th className="p-3">Daily rate</th>
              <th className="p-3">Duties</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {guides.map((g) => (
              <tr key={g.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3 font-semibold">
                  <div className="flex items-center gap-2">
                    {g.photoUrl?.startsWith("/uploads/") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                    )}
                    {g.fullName}
                  </div>
                </td>
                <td className="p-3">{g.barangay}</td>
                <td className="p-3 text-ink-600">{parseList(g.specialties).join(", ") || "—"}</td>
                <td className="p-3">{peso(g.dailyRate)}</td>
                <td className="p-3">{g._count.assignments}</td>
                <td className="p-3"><span className={`pill ${g.status === "active" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{g.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/guides/${g.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
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
