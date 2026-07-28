import { prisma } from "@/lib/prisma";

/**
 * Product order reference: "{bookingCode}-P{n}" — one booking can spawn several
 * orders (cart checked out more than once before the trip), so the suffix is a
 * per-booking sequence number rather than a fresh random code.
 */
export async function productOrderCode(bookingCode: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.productOrder.count({ where: { booking: { bookingCode } } });
    const code = `${bookingCode}-P${count + 1 + attempt}`;
    const taken = await prisma.productOrder.findUnique({ where: { orderCode: code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique product order reference.");
}
