import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PackageForm from "../../PackageForm";

export const dynamic = "force-dynamic";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, destinations] = await Promise.all([
    prisma.tourPackage.findUnique({
      where: { id: Number(id) },
      include: { destinations: { orderBy: { visitOrder: "asc" } } },
    }),
    prisma.destination.findMany({
      where: { status: "active" },
      select: { id: true, name: true, barangay: true },
      orderBy: { id: "asc" },
    }),
  ]);
  if (!p) notFound();
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Edit — {p.name}</h1>
      <PackageForm p={p} destinations={destinations} />
    </>
  );
}
