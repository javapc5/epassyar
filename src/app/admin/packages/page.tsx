import Link from "next/link";
import { PlusIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPackages() {
  const packages = await prisma.tourPackage.findMany({
    include: { destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } }, _count: { select: { bookings: true } } },
    orderBy: { id: "asc" },
  });
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Tour Packages</h1>
          <p className="text-sm text-ink-600">Create packages with destinations, pricing, inclusions, and capacity.</p>
        </div>
        <Link href="/admin/packages/new" className="btn btn-amber"><PlusIcon size={16} weight="bold" /> Create package</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-xs uppercase tracking-wide text-ink-600">
            <tr>
              <th className="p-3">Package</th>
              <th className="p-3">Destinations</th>
              <th className="p-3">Price/pax</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Bookings</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-t border-line hover:bg-brand-100/30">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3 text-ink-600">{p.destinations.map((pd) => pd.destination.name).join(" → ")}</td>
                <td className="p-3">{peso(p.pricePerPax)}</td>
                <td className="p-3">{p.minPax}–{p.maxPax} pax</td>
                <td className="p-3">{p._count.bookings}</td>
                <td className="p-3"><span className={`pill ${p.status === "active" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span></td>
                <td className="p-3">
                  <Link href={`/admin/packages/${p.id}/edit`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
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
