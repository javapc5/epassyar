"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const MUNICIPALITY_ID = 1;

export async function saveBranding(formData: FormData) {
  await requireUser();
  const logo = String(formData.get("logoPath") ?? "").trim() || null;
  await prisma.municipality.update({
    where: { id: MUNICIPALITY_ID },
    data: {
      name: String(formData.get("name") ?? "").trim() || "Municipality",
      province: String(formData.get("province") ?? "").trim() || "",
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      contactNumber: String(formData.get("contactNumber") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      ...(logo ? { logoUrl: logo } : {}),
    },
  });
  revalidatePath("/", "layout");
}

export async function saveFees(formData: FormData) {
  await requireUser();
  const updates: { feeCode: string; amount: number }[] = [
    { feeCode: "ENVIRONMENTAL", amount: Number(formData.get("environmental") ?? 0) || 0 },
    { feeCode: "INSURANCE", amount: Number(formData.get("insurance") ?? 0) || 0 },
    { feeCode: "RESERVATION", amount: Number(formData.get("reservation") ?? 20) || 20 },
  ];
  for (const u of updates) {
    await prisma.feeSetting.updateMany({
      where: { municipalityId: MUNICIPALITY_ID, feeCode: u.feeCode },
      data: { amount: u.amount },
    });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/build");
}

export async function saveGcash(formData: FormData) {
  await requireUser();
  const qr = String(formData.get("qrPath") ?? "").trim() || null;
  await prisma.municipality.update({
    where: { id: MUNICIPALITY_ID },
    data: {
      gcashName: String(formData.get("gcashName") ?? "").trim() || null,
      gcashNumber: String(formData.get("gcashNumber") ?? "").trim() || null,
      ...(qr ? { gcashQrUrl: qr } : {}),
    },
  });
  revalidatePath("/admin/settings");
}

export async function saveHeroAppearance(formData: FormData) {
  await requireUser();
  const transition = String(formData.get("heroTransition") ?? "fade");
  const allowed = new Set(["fade", "slide", "zoom"]);
  // The form field is entered in seconds; store milliseconds.
  const intervalMs = Math.round((Number(formData.get("heroIntervalMs") ?? 5) || 5) * 1000);
  await prisma.municipality.update({
    where: { id: MUNICIPALITY_ID },
    data: {
      heroIntervalMs: Math.min(20000, Math.max(2000, intervalMs)),
      heroTransition: allowed.has(transition) ? transition : "fade",
      heroTransitionMs: Math.min(2000, Math.max(200, Number(formData.get("heroTransitionMs") ?? 700) || 700)),
      heroCaptionsEnabled: formData.get("heroCaptionsEnabled") === "on",
    },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}

export async function saveExpiry(formData: FormData) {
  await requireUser();
  await prisma.municipality.update({
    where: { id: MUNICIPALITY_ID },
    data: { reservationExpiryHours: Math.max(1, Number(formData.get("hours") ?? 24) || 24) },
  });
  revalidatePath("/admin/settings");
}

export async function addTransportRoute(formData: FormData) {
  await requireUser();
  const routeName = String(formData.get("routeName") ?? "").trim();
  if (!routeName) return;
  const feePerPax = Number(formData.get("feePerPax") ?? 0) || null;
  const feePerTrip = Number(formData.get("feePerTrip") ?? 0) || null;
  await prisma.transportRoute.create({
    data: {
      municipalityId: MUNICIPALITY_ID,
      routeName,
      vehicleType: String(formData.get("vehicleType") ?? "").trim() || "Habal-habal",
      feePerPax,
      feePerTrip,
      maxPaxPerTrip: Number(formData.get("maxPaxPerTrip") ?? 0) || null,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/build");
}

export async function toggleTransportRoute(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const route = await prisma.transportRoute.findUnique({ where: { id } });
  if (!route) return;
  await prisma.transportRoute.update({ where: { id }, data: { isActive: !route.isActive } });
  revalidatePath("/admin/settings");
  revalidatePath("/build");
}
