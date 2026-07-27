import path from "path";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary auto-configures from CLOUDINARY_URL env var
// Format: cloudinary://api_key:api_secret@cloud_name

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB — hero banner clips
const ALLOWED_IMAGE = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_VIDEO = new Set([".mp4", ".webm"]);

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
  const resourceType = isVideo ? "video" : "image";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "epassyar", resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed."));
        resolve(result.secure_url);
      },
    );
    stream.end(bytes);
  });
}
