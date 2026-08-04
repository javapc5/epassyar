import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Single-tenant app — looks up the one Municipality row instead of assuming its id, which shifts whenever the DB is reseeded. */
export async function getMunicipalityId(): Promise<number> {
  const municipality = await prisma.municipality.findFirst({ select: { id: true } });
  if (!municipality) throw new Error("No municipality is configured.");
  return municipality.id;
}
