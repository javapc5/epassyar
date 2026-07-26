import { prisma } from "@/lib/prisma";

/**
 * SMS delivery backbone. Every booking event already writes a row to `SmsLog`
 * (audit trail, atomic with the booking change). This dispatcher picks up those
 * queued rows and actually sends them.
 *
 * Delivery is via Semaphore (https://semaphore.co) — a Philippine SMS gateway,
 * pay-as-you-go, no app install for the recipient. It activates automatically
 * once these env vars are set:
 *   SEMAPHORE_API_KEY   — your Semaphore API key
 *   SEMAPHORE_SENDER    — approved sender name (optional, e.g. "BagulinLGU")
 *
 * Without a key it is a safe no-op: rows stay `queued` so nothing is lost and
 * the office can still read every message in the SMS log. This keeps local dev
 * and unconfigured deployments working exactly as before.
 */

const API_KEY = process.env.SEMAPHORE_API_KEY;
const SENDER = process.env.SEMAPHORE_SENDER;
const ENDPOINT = "https://api.semaphore.co/api/v4/messages";

function normalizePH(mobile: string): string | null {
  const d = mobile.replace(/\D/g, "");
  if (d.startsWith("63") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return `63${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("9")) return `63${d}`;
  return null;
}

async function sendOne(number: string, message: string): Promise<boolean> {
  const params = new URLSearchParams({ apikey: API_KEY!, number, message });
  if (SENDER) params.set("sendername", SENDER);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return res.ok;
}

/**
 * Send all queued SMS (optionally just for one booking). Returns how many were
 * sent. Never throws — delivery failures are recorded on the row, not bubbled
 * up, so a texting outage can never roll back a confirmed booking.
 */
export async function dispatchQueuedSms(bookingId?: number): Promise<number> {
  const queued = await prisma.smsLog.findMany({
    where: { status: "queued", ...(bookingId ? { bookingId } : {}) },
  });
  if (queued.length === 0) return 0;

  // Not configured yet — leave rows queued (readable in the SMS log) and stop.
  if (!API_KEY) return 0;

  let sent = 0;
  for (const row of queued) {
    const number = normalizePH(row.recipientMobile);
    try {
      const ok = number ? await sendOne(number, row.message) : false;
      await prisma.smsLog.update({
        where: { id: row.id },
        data: { status: ok ? "sent" : "failed", sentAt: ok ? new Date() : null },
      });
      if (ok) sent++;
    } catch {
      await prisma.smsLog.update({ where: { id: row.id }, data: { status: "failed" } });
    }
  }
  return sent;
}
