import { prisma } from "@/lib/prisma";
import { parseList } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Builder from "./Builder";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const [destinations, transport] = await Promise.all([
    prisma.destination.findMany({ where: { status: "active" }, orderBy: { id: "asc" } }),
    prisma.transportRoute.findMany({ where: { isActive: true } }),
  ]);

  const destData = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    barangay: d.barangay,
    category: d.category,
    guideRequired: d.guideRequired,
    trekkingDuration: d.trekkingDuration,
    activities: parseList(d.activities),
  }));
  const transportData = transport.map((t) => ({
    id: t.id,
    routeName: t.routeName,
    vehicleType: t.vehicleType,
    feePerPax: t.feePerPax,
    feePerTrip: t.feePerTrip,
  }));

  return (
    <>
      <SiteHeader />
      <main className="wrap py-8">
        <h1 className="font-display text-2xl font-extrabold">Build Your Own Itinerary</h1>
        <p className="mt-1 text-[13.5px] text-ink-600">Pick your destinations and see every fee before you reserve. Free until you pay the reservation fee.</p>
        <div className="mt-6">
          <Builder destinations={destData} transport={transportData} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
