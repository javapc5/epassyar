import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideForm from "../../GuideForm";

export const dynamic = "force-dynamic";

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await prisma.tourGuide.findUnique({ where: { id: Number(id) } });
  if (!g) notFound();
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Edit — {g.fullName}</h1>
      <GuideForm g={g} />
    </>
  );
}
