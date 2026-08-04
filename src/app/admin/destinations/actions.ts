"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma, getMunicipalityId } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function saveDestination(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Destination name is required.");

  // Cropped & uploaded client-side by ImageCropUpload; the form submits the stored path.
  const photo = String(formData.get("photoPath") ?? "").trim() || null;

  const data = {
    municipalityId: await getMunicipalityId(),
    name,
    barangay: String(formData.get("barangay") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || "Attraction",
    description: String(formData.get("description") ?? "").trim() || null,
    activities: JSON.stringify(
      String(formData.get("activities") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    trekkingDuration: String(formData.get("trekkingDuration") ?? "").trim() || null,
    difficulty: String(formData.get("difficulty") ?? "easy"),
    guideRequired: formData.get("guideRequired") === "on",
    entranceFee: Number(formData.get("entranceFee") ?? 0) || 0,
    environmentalFee: Number(formData.get("environmentalFee") ?? 0) || 0,
    dailyCapacity: Math.max(1, Number(formData.get("dailyCapacity") ?? 50) || 50),
    openTime: String(formData.get("openTime") ?? "07:00"),
    closeTime: String(formData.get("closeTime") ?? "17:00"),
    whatToBring: String(formData.get("whatToBring") ?? "").trim() || null,
    safetyNotes: String(formData.get("safetyNotes") ?? "").trim() || null,
    status: String(formData.get("status") ?? "active"),
    ...(photo ? { mainImage: photo } : {}),
  };

  if (id) {
    await prisma.destination.update({ where: { id }, data });
  } else {
    await prisma.destination.create({ data });
  }

  revalidatePath("/destinations");
  revalidatePath("/");
  redirect("/admin/destinations");
}
