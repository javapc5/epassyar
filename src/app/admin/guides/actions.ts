"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma, getMunicipalityId } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function saveGuide(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) throw new Error("Guide name is required.");

  const photo = String(formData.get("photoPath") ?? "").trim() || null;

  const data = {
    municipalityId: await getMunicipalityId(),
    fullName,
    barangay: String(formData.get("barangay") ?? "").trim(),
    mobile: String(formData.get("mobile") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    yearsExperience: Math.max(0, Number(formData.get("yearsExperience") ?? 0) || 0),
    specialties: JSON.stringify(
      String(formData.get("specialties") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    dailyRate: Math.max(0, Number(formData.get("dailyRate") ?? 600) || 600),
    maxGroupSize: Math.max(1, Number(formData.get("maxGroupSize") ?? 10) || 10),
    accreditationNo: String(formData.get("accreditationNo") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active"),
    ...(photo ? { photoUrl: photo } : {}),
  };

  if (id) {
    await prisma.tourGuide.update({ where: { id }, data });
  } else {
    await prisma.tourGuide.create({ data });
  }

  revalidatePath("/guides");
  redirect("/admin/guides");
}
