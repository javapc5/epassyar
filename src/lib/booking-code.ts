import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Booking reference generation. Server-only: it pulls in node:crypto, whereas
 * src/lib/format.ts (where this used to live) is imported by client components.
 *
 * The alphabet drops look-alike characters (I/O/0/1) because tourists read these
 * off an SMS and type them into /my-booking.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 8; // 32^8 ≈ 1.1e12 — enumeration is impractical even unthrottled

/**
 * Uses crypto.randomInt rather than Math.random. The code is one of the two
 * secrets that gate a booking page (see src/lib/booking-access.ts), and V8's
 * Math.random state is recoverable from a handful of outputs — which would let
 * someone who made one booking derive other travelers' references.
 */
function generate(): string {
  let s = "";
  for (let i = 0; i < LENGTH; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return "BGL-" + s;
}

/**
 * Returns a reference that is not already taken. `bookingCode` is UNIQUE in the
 * schema, so a blind insert would surface a collision to the tourist as a 500;
 * at this keyspace the loop effectively never runs twice.
 */
export async function bookingCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generate();
    const taken = await prisma.booking.findUnique({ where: { bookingCode: code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique booking reference.");
}
