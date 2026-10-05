import path from "path";
import { prisma } from "@/lib/prisma";

/**
 * Database-backed upload store — no Cloudinary / S3, nothing leaves the app's own
 * Postgres database. The file bytes are written to the `Media` table and served
 * back through the route `GET /api/media/<id>` (the id is an unguessable cuid).
 * This keeps uploaded photos persistent on Vercel, whose serverless filesystem
 * does not survive between requests or redeploys.
 *
 * `src/lib/format.ts#isMediaUrl` recognises the `/api/media/` shape (plus legacy
 * `/uploads/` paths and old Cloudinary https:// URLs so existing rows still load).
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB — hero banner clips
const ALLOWED_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_VIDEO = new Set([".mp4", ".webm"]);
const EXT_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function saveUpload(file: File | null | undefined): Promise<string | null> {
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
  const mimeType = file.type || EXT_MIME[ext] || "application/octet-stream";

  const media = await prisma.media.create({
    data: { mimeType, data: bytes },
    select: { id: true },
  });

  return `/api/media/${media.id}`;
}
