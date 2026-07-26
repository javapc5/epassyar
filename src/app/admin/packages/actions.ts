"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const MUNICIPALITY_ID = 1;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function savePackage(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Package name is required.");

  const destinationIds = formData.getAll("destinationIds").map(Number).filter(Boolean);
  if (destinationIds.length === 0) throw new Error("Select at least one destination.");

  const photo = String(formData.get("photoPath") ?? "").trim() || null;

  const included = String(formData.get("inclusions") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean)
    .map((label) => ({ label, included: true }));
  const excluded = String(formData.get("exclusions") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean)
    .map((label) => ({ label, included: false }));

  const data = {
    municipalityId: MUNICIPALITY_ID,
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    durationDays: Math.max(1, Number(formData.get("durationDays") ?? 1) || 1),
    durationLabel: String(formData.get("durationLabel") ?? "").trim() || "Full day",
    pricePerPax: Math.max(0, Number(formData.get("pricePerPax") ?? 0) || 0),
    minPax: Math.max(1, Number(formData.get("minPax") ?? 1) || 1),
    maxPax: Math.max(1, Number(formData.get("maxPax") ?? 20) || 20),
    itineraryNotes: String(formData.get("itineraryNotes") ?? "").trim() || null,
    inclusions: JSON.stringify([...included, ...excluded]),
    status: String(formData.get("status") ?? "active"),
    ...(photo ? { mainImage: photo } : {}),
  };

  let packageId: number;
  if (id) {
    await prisma.tourPackage.update({ where: { id }, data });
    await prisma.packageDestination.deleteMany({ where: { packageId: id } });
    packageId = id;
  } else {
    const created = await prisma.tourPackage.create({
      data: { ...data, slug: slugify(name) + "-" + Math.random().toString(36).slice(2, 6) },
    });
    packageId = created.id;
  }

  await prisma.packageDestination.createMany({
    data: destinationIds.map((destinationId, i) => ({ packageId, destinationId, visitOrder: i + 1 })),
  });

  revalidatePath("/packages");
  revalidatePath("/");
  redirect("/admin/packages");
}
