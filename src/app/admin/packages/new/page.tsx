import { prisma } from "@/lib/prisma";
import PackageForm from "../PackageForm";

export const dynamic = "force-dynamic";

export default async function NewPackagePage() {
  const destinations = await prisma.destination.findMany({
    where: { status: "active" },
    select: { id: true, name: true, barangay: true },
    orderBy: { id: "asc" },
  });
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Create Tour Package</h1>
      <PackageForm destinations={destinations} />
    </>
  );
}
