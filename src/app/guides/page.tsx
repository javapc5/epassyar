import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { GuideCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await prisma.tourGuide.findMany({ where: { status: "active" }, orderBy: [{ ratingCount: "desc" }, { fullName: "asc" }] });
  const byBarangay = guides.reduce<Record<string, number>>((acc, g) => {
    acc[g.barangay] = (acc[g.barangay] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Accredited Community Tour Guides</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">{guides.length} trained locals from {Object.keys(byBarangay).length} barangays — one is assigned to every booking and notified by SMS.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(byBarangay).map(([b, n]) => (
            <span key={b} className="chip">{b}: {n}</span>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {guides.map((g) => (
            <GuideCard key={g.id} g={g} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
