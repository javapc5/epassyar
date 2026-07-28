"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, verifyPassword, hashPassword, needsRehash } from "@/lib/auth";
import { rateLimit, resetLimit, clientIp } from "@/lib/rate-limit";

/** Brute-force budget: 8 attempts per IP and per account in a 15-minute window. */
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * A real scrypt hash of a value nobody can supply. Verified against when the
 * email is unknown so a failed login costs the same time either way — otherwise
 * response latency alone tells an attacker which addresses are real accounts.
 */
const DECOY_HASH = "scrypt2:0000000000000000000000000000000000000000000000000000000000000000:" + "0".repeat(64);

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";
  const fail = `/login?e=1&next=${encodeURIComponent(next)}`;
  const throttled = `/login?e=rate&next=${encodeURIComponent(next)}`;

  if (!email || !password) redirect(fail);

  // Limit by IP *and* by account: one stops a single host spraying many accounts,
  // the other stops a botnet converging on the admin address.
  const ip = await clientIp();
  const byIp = rateLimit(`login:ip:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  const byAccount = rateLimit(`login:acct:${email}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!byIp.ok || !byAccount.ok) redirect(throttled);

  const user = await prisma.user.findFirst({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DECOY_HASH);

  if (!user || user.status !== "active" || !ok) {
    redirect(fail);
  }

  resetLimit(`login:ip:${ip}`);
  resetLimit(`login:acct:${email}`);

  // Re-hash under the current cost parameters when the stored hash is older.
  if (needsRehash(user.passwordHash)) {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  }

  const token = createSessionToken(user.id, user.role);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(next);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
