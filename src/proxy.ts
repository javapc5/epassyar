import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SECRET } from "@/lib/secrets";

/**
 * Route gate for the Tourism Office admin (Next's "proxy" convention, formerly
 * "middleware"). Runs on the edge and verifies the signed session cookie
 * WITHOUT a database call (Web Crypto HMAC — same secret
 * and algorithm the Node side uses in src/lib/auth.ts). Unauthenticated:
 *   - /admin/*      → redirect to /login
 *   - /api/admin/*  → 401 JSON
 */

const SESSION_COOKIE = "bagulin_session";
const SECRET = AUTH_SECRET;

async function hmacHex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [id, role, exp, sig] = parts;
  if (Number(exp) < Date.now()) return false;
  return (await hmacHex(`${id}.${role}.${exp}`)) === sig;
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await isValidSession(token);
  if (ok) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
