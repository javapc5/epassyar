import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight session auth for the Tourism Office admin — no external deps.
 * Passwords are hashed with Node's built-in scrypt; the session is a signed
 * (HMAC-SHA256) stateless cookie so the edge middleware can gate routes
 * without a database round-trip. See src/middleware.ts for the gate.
 */

export const SESSION_COOKIE = "bagulin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SECRET = process.env.AUTH_SECRET ?? "bagulin-auth-dev-change-me-in-prod";
if (process.env.NODE_ENV === "production" && SECRET === "bagulin-auth-dev-change-me-in-prod") {
  throw new Error("AUTH_SECRET env var must be set in production.");
}

export type Role = "SUPER_ADMIN" | "TOURISM_ADMIN" | "STAFF" | "GUIDE";
export type SessionUser = { id: number; fullName: string; role: Role; email: string | null };

/* ---------- password hashing (scrypt) ---------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Legacy demo accounts seeded as "demo:<plaintext>" — accept, then upgrade on login.
  if (stored.startsWith("demo:")) return stored.slice(5) === password;
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const check = crypto.scryptSync(password, salt, 32).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(check, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return false;
}

/* ---------- signed session token ---------- */

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function createSessionToken(userId: number, role: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${role}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): { userId: number; role: Role } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [id, role, exp, sig] = parts;
  const expected = sign(`${id}.${role}.${exp}`);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig.padEnd(expected.length, "\0"), "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return { userId: Number(id), role: role as Role };
}

/* ---------- server-side helpers ---------- */

/** Reads and validates the session, then loads the current user from the DB. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claim = verifySessionToken(token);
  if (!claim) return null;
  const user = await prisma.user.findUnique({ where: { id: claim.userId } });
  if (!user || user.status !== "active") return null;
  return { id: user.id, fullName: user.fullName, role: user.role as Role, email: user.email };
}

/** For admin pages/layout — redirect to the login screen when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
