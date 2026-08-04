"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma, getMunicipalityId } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function saveAccommodation(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const photo = String(formData.get("photoPath") ?? "").trim() || null;

  const data = {
    municipalityId: await getMunicipalityId(),
    name,
    type: String(formData.get("type") ?? "homestay"),
    barangay: String(formData.get("barangay") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    contactPerson: String(formData.get("contactPerson") ?? "").trim() || null,
    contactNumber: String(formData.get("contactNumber") ?? "").trim() || null,
    priceRange: String(formData.get("priceRange") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active"),
    ...(photo ? { image: photo } : {}),
  };

  if (id) {
    await prisma.accommodation.update({ where: { id }, data });
  } else {
    await prisma.accommodation.create({ data });
  }

  revalidatePath("/stay");
  redirect("/admin/stay");
}
