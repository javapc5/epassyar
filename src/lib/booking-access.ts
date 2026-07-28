import crypto from "crypto";
import { cookies } from "next/headers";
import { AUTH_SECRET } from "@/lib/secrets";

/**
 * Proof-of-ownership for a tourist's booking page.
 *
 * /booking/[code] shows the traveler's name, itinerary, amounts and QR pass, so
 * the reference code alone must not be enough to open it — codes are short and
 * would otherwise be enumerable. Access is granted in exactly two places:
 *
 *   1. right after the tourist submits the booking (they clearly own it), and
 *   2. after a successful /my-booking lookup, which already proves knowledge of
 *      the code *and* the last 4 digits of the mobile number on file.
 *
 * The grant is a short signed cookie scoped to one booking code. Staff never
 * need it — they read bookings through the authenticated /admin views.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — covers the trip plus a look back
const PREFIX = "bkpass_";

function cookieName(code: string): string {
  // Cookie names allow hyphens but not much else; codes are [A-Z0-9-] already.
  return PREFIX + code.replace(/[^A-Z0-9]/gi, "");
}

function sign(code: string, exp: number): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(`${code}.${exp}`).digest("hex");
}

/** Marks the current browser as entitled to view `code`. */
export async function grantBookingAccess(code: string): Promise<void> {
  const exp = Date.now() + TTL_MS;
  const jar = await cookies();
  jar.set(cookieName(code), `${exp}.${sign(code, exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

/** True when this browser has a valid, unexpired grant for `code`. */
export async function hasBookingAccess(code: string): Promise<boolean> {
  const raw = (await cookies()).get(cookieName(code))?.value;
  if (!raw) return false;

  const [expRaw, sig] = raw.split(".");
  const exp = Number(expRaw);
  if (!exp || !sig || exp < Date.now()) return false;

  const expected = sign(code, exp);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig.padEnd(expected.length, "\0"), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
