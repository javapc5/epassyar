import Link from "next/link";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso, isMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDestinations() {
  const destinations = await prisma.destination.findMany({ orderBy: { id: "asc" } });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Destinations</h1>
          <p className="text-sm text-ink-600">Add destinations, upload photos, and set fees & daily capacity — changes appear on the public site immediately.</p>
        </div>
        <Link href="/admin/destinations/new" className="btn btn-amber"><PlusIcon size={16} weight="bold" /> Add destination</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Destination</th>
              <th className="p-3">Barangay</th>
              <th className="p-3">Category</th>
              <th className="p-3">Entrance</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Guide</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => (
              <tr key={d.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3 font-semibold">
                  <div className="flex items-center gap-2">
                    {isMediaUrl(d.mainImage) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.mainImage} alt="" className="h-8 w-12 rounded object-cover" />
                    )}
                    {d.name}
                  </div>
                </td>
                <td className="p-3">{d.barangay}</td>
                <td className="p-3">{d.category}</td>
                <td className="p-3">{d.entranceFee > 0 ? peso(d.entranceFee) : "Free"}</td>
                <td className="p-3">{d.dailyCapacity} pax</td>
                <td className="p-3">{d.guideRequired ? "Required" : "Optional"}</td>
                <td className="p-3"><span className={`pill ${d.status === "active" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{d.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/destinations/${d.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
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
