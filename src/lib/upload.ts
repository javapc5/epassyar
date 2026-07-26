import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB — hero banner clips
const ALLOWED_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_VIDEO = new Set([".mp4", ".webm"]);

/**
 * Saves an uploaded image OR video to /public/uploads and returns its public
 * path ("/uploads/<file>"). Returns null when no file was provided; throws on
 * invalid type/size so forms can surface the error.
 */
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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeBase = (file.name || "photo")
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 40);
  const filename = `${Date.now()}-${safeBase}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}
