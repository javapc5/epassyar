import { headers } from "next/headers";

/**
 * Small in-process rate limiter — no Redis, no extra service to run.
 *
 * This is sized for how the app is actually deployed: a single PM2 instance
 * behind nginx (see ecosystem.config.js, `instances: 1`). If that ever becomes
 * a cluster, each worker would keep its own counters and the effective limit
 * would multiply by the worker count — move the buckets to Redis at that point.
 *
 * nginx applies a coarser `limit_req` in front of this (see nginx.conf); these
 * limits are the per-action ones that need to know *what* is being attempted.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Drop expired buckets occasionally so the map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Fixed-window counter. Returns `ok: false` once `limit` hits land inside
 * `windowMs`, along with how long the caller should wait.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Clears a bucket — call after a success so a good login resets the attempt count. */
export function resetLimit(key: string) {
  buckets.delete(key);
}

/**
 * Best-effort client IP. nginx sets X-Real-IP and appends to X-Forwarded-For;
 * we take the left-most XFF entry (the original client) and fall back to a
 * shared bucket so a missing header fails closed into *some* limit rather than
 * silently exempting the request.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Same as `clientIp` for plain Route Handlers, which get the Request directly. */
export function clientIpFrom(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
