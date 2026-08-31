import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/upload";
import { getSessionUser } from "@/lib/auth";

/** Receives the cropped image blob from ImageCropUpload and stores it. */
export async function POST(req: Request) {
  // Checked here as well as in middleware — the matcher is one config edit away
  // from leaving this open, and it writes files to the server's disk.
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    // Callers that handle sensitive images (payment proofs, IDs) send
    // visibility=private; everything else defaults to public /uploads/.
    const visibility = formData.get("visibility") === "private" ? "private" : "public";
    const url = await saveUpload(file, { visibility });
    if (!url) return NextResponse.json({ error: "No file received." }, { status: 400 });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload failed." }, { status: 400 });
  }
}
