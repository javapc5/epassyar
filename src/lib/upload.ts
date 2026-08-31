import path from "path";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";

/**
 * Local-disk upload store — no third-party (Cloudinary/S3), nothing leaves the
 * server. Two visibilities:
 *
 *   public  → written to `public/uploads/`, served directly at `/uploads/<name>`.
 *             Use for anything shown on the tourist site (destination/guide/
 *             package/gallery photos, the GCash QR the tourist scans).
 *
 *   private → written to `private-uploads/` OUTSIDE the web root, so it is never
 *             served as a static file. It is streamed only through the auth-gated
 *             route `GET /api/admin/media/<name>` (staff session required). The
 *             value stored in the DB is that gated URL. Use for sensitive images
 *             (payment-proof screenshots, IDs).
 *
 * `src/lib/format.ts#isMediaUrl` recognises both shapes.
 *
 * NOTE: assumes a persistent local filesystem (XAMPP / self-hosted VPS with PM2
 * + nginx). On an ephemeral host like Vercel neither directory persists — use a
 * mounted volume or object store there.
 */

export type Visibility = "public" | "private";

/** Gated route that streams private files. Kept in sync with isMediaUrl + the route. */
export const PRIVATE_MEDIA_PREFIX = "/api/admin/media";

export const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const PRIVATE_UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB — hero banner clips
const ALLOWED_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_VIDEO = new Set([".mp4", ".webm"]);

export async function saveUpload(
  file: File | null | undefined,
  opts: { visibility?: Visibility } = {},
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const isVideo = ALLOWED_VIDEO.has(ext);
  const isImage = ALLOWED_IMAGE.has(ext);
  if (!isVideo && !isImage) {
    throw new Error("Allowed files: JPG, PNG, WEBP, GIF images — or MP4 / WEBM video.");
  }
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    throw new Error(isVideo ? "Video is too large (max 40 MB)." : "Image is too large (max 8 MB).");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Random, unguessable filename — never trust the client's name (path traversal,
  // collisions, weird characters). The extension is already validated above.
  const name = `${Date.now()}-${randomBytes(12).toString("hex")}${ext}`;

  const isPrivate = opts.visibility === "private";
  const dir = isPrivate ? PRIVATE_UPLOAD_DIR : PUBLIC_UPLOAD_DIR;

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);

  return isPrivate ? `${PRIVATE_MEDIA_PREFIX}/${name}` : `/uploads/${name}`;
}
