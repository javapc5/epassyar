import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.localProduct.findUnique({ where: { id: Number(id) } });
  if (!p) notFound();
  return (
    <>
      <h1 className="mb-5 font-display text-2xl font-extrabold">Edit — {p.name}</h1>
      <ProductForm p={p} />
    </>
  );
}
