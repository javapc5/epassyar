import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DestinationForm from "../../DestinationForm";

export const dynamic = "force-dynamic";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.destination.findUnique({ where: { id: Number(id) } });
  if (!d) notFound();
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Edit — {d.name}</h1>
      <DestinationForm d={d} />
    </>
  );
}
