import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PackageCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await prisma.tourPackage.findMany({
    where: { status: "active" },
    include: { destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } } },
    orderBy: { id: "asc" },
  });
  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Tour Packages</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">Ready-made itineraries — guide, entrance fees & insurance included.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {packages.map((p, i) => (
            <PackageCard key={p.id} p={p} slotsLeft={[8, 12, 6][i] ?? p.maxPax} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
