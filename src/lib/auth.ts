import crypto from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUTH_SECRET } from "@/lib/secrets";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

/**
 * Lightweight session auth for the Tourism Office admin — no external deps.
 * Passwords are hashed with Node's built-in scrypt; the session is a signed
 * (HMAC-SHA256) stateless cookie so the edge proxy can gate routes
 * without a database round-trip. See src/proxy.ts for the gate.
 */

export const SESSION_COOKIE = "bagulin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const SECRET = AUTH_SECRET;

export type Role = "SUPER_ADMIN" | "TOURISM_ADMIN" | "STAFF" | "GUIDE";
export type SessionUser = { id: number; fullName: string; role: Role; email: string | null };

/* ---------- password hashing (scrypt) ---------- */

/**
 * Cost parameters follow OWASP's scrypt guidance (the N=2^15 / r=8 / p=3 tier),
 * which reaches the recommended work factor through p rather than N — ~34 MB per
 * hash instead of ~134 MB, so concurrent logins cannot push the process past the
 * 512 MB PM2 restart ceiling in ecosystem.config.js.
 *
 * Hashes are prefixed with their parameter set so the cost can be raised later
 * without locking anyone out: `verifyPassword` still accepts the older `scrypt:`
 * format (Node defaults) and `needsRehash` tells the login action to upgrade it.
 */
const SCRYPT_OPTS: crypto.ScryptOptions = { N: 32768, r: 8, p: 3, maxmem: 96 * 1024 * 1024 };
const LEGACY_OPTS: crypto.ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 32, SCRYPT_OPTS)).toString("hex");
  return `scrypt2:${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const opts = scheme === "scrypt2" ? SCRYPT_OPTS : scheme === "scrypt" ? LEGACY_OPTS : null;
  if (!opts) return false; // unknown/plaintext scheme — never accept

  const check = await scrypt(password, salt, 32, opts);
  const a = Buffer.from(hash, "hex");
  return a.length === check.length && crypto.timingSafeEqual(a, check);
}

/** True when a stored hash uses an older parameter set and should be re-hashed on login. */
export function needsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt2:");
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

/** Roles allowed to change money-handling and municipality-wide configuration. */
export const MANAGER_ROLES: Role[] = ["SUPER_ADMIN", "TOURISM_ADMIN"];

/**
 * Like `requireUser`, but also enforces a role. Front-line staff and guides can
 * work bookings and check-ins; only managers may edit fees, GCash payout details
 * and branding. Redirects rather than throwing so admin pages degrade gracefully.
 */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/admin?denied=1");
  return user;
}
