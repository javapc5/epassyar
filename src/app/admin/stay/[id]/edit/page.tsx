import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AccommodationForm from "../../AccommodationForm";

export const dynamic = "force-dynamic";

export default async function EditAccommodationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.accommodation.findUnique({ where: { id: Number(id) } });
  if (!a) notFound();
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Edit — {a.name}</h1>
      <AccommodationForm a={a} />
    </>
  );
}
