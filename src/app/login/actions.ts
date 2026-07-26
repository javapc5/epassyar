"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, verifyPassword, hashPassword } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";
  const fail = `/login?e=1&next=${encodeURIComponent(next)}`;

  if (!email || !password) redirect(fail);

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
    redirect(fail);
  }

  // Upgrade legacy demo passwords to a real scrypt hash on first successful login.
  if (user.passwordHash.startsWith("demo:")) {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } });
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
