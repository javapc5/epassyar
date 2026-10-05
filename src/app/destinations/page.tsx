import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DestinationCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function DestinationsPage() {
  const destinations = await prisma.destination.findMany({ where: { status: "active" }, orderBy: { id: "asc" } });
  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Tourist Destinations</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">{destinations.length} destinations across the barangays of Bagulin.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.id} d={d} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
