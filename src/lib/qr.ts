import crypto from "crypto";
import QRCode from "qrcode";

const SECRET = process.env.QR_SIGNING_SECRET ?? "bagulin-qr-dev-change-me-in-prod";
if (process.env.NODE_ENV === "production" && SECRET === "bagulin-qr-dev-change-me-in-prod") {
  throw new Error("QR_SIGNING_SECRET env var must be set in production.");
}

/** Builds the check-in URL a scanned tourist pass points at (staff-gated). */
export function checkInUrl(origin: string, token: string): string {
  return `${origin}/admin/checkin?t=${encodeURIComponent(token)}`;
}

/** Renders a real, scannable QR code as a PNG data URI (server-side). */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#0C330F", light: "#FFFFFF" },
  });
}

/** Signed, tamper-proof token embedded in the QR tourist pass. */
export function signPass(bookingId: number, bookingCode: string): string {
  const payload = `${bookingId}.${bookingCode}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyPass(token: string): { bookingId: number; bookingCode: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, code, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(`${id}.${code}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig.padEnd(expected.length, "\0"), "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { bookingId: Number(id), bookingCode: code };
}
