"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma, getMunicipalityId } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function saveProduct(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required.");

  // Cropped & uploaded client-side by ImageCropUpload; the form submits the stored path.
  const photo = String(formData.get("photoPath") ?? "").trim() || null;

  const data = {
    municipalityId: await getMunicipalityId(),
    name,
    category: String(formData.get("category") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    producer: String(formData.get("producer") ?? "").trim() || null,
    supplierMobile: String(formData.get("supplierMobile") ?? "").trim() || null,
    whereToBuy: String(formData.get("whereToBuy") ?? "").trim() || null,
    unit: String(formData.get("unit") ?? "pcs"),
    price: Math.max(0, Number(formData.get("price") ?? 0) || 0),
    costPrice: Math.max(0, Number(formData.get("costPrice") ?? 0) || 0),
    availabilityMode: String(formData.get("availabilityMode") ?? "in_stock"),
    stockQty: Math.max(0, Number(formData.get("stockQty") ?? 0) || 0),
    leadTimeDays: Math.max(0, Number(formData.get("leadTimeDays") ?? 0) || 0),
    isFeatured: formData.get("isFeatured") === "on",
    featuredRank: Number(formData.get("featuredRank") ?? 0) || 0,
    status: String(formData.get("status") ?? "available"),
    ...(photo ? { image: photo } : {}),
  };

  if (id) {
    await prisma.localProduct.update({ where: { id }, data });
  } else {
    await prisma.localProduct.create({ data });
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}
