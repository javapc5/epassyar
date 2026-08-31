import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { getSessionUser } from "@/lib/auth";
import { PRIVATE_UPLOAD_DIR } from "@/lib/upload";

/**
 * Streams a PRIVATE upload (payment proofs, IDs, etc.) to authenticated staff
 * only. The file lives in `private-uploads/` outside the web root, so it is
 * never served as a static asset — this route is the sole way to read it. The
 * proxy already gates `/api/admin/*` (401 without a session); we re-check here
 * because that matcher is one config edit away from leaving this open.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { name } = await params;

  // Only a bare filename is ever valid — reject anything that could escape the
  // private directory (slashes, "..", null bytes, odd characters).
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.includes("..") || path.basename(name) !== name) {
    return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });

  try {
    const data = await readFile(path.join(PRIVATE_UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        // Private, per-user content — never cache in a shared/CDN layer.
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
