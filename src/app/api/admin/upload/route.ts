import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/upload";
import { getSessionUser } from "@/lib/auth";

/** Receives the cropped image blob from ImageCropUpload and stores it. */
export async function POST(req: Request) {
  // Checked here as well as in middleware — the matcher is one config edit away
  // from leaving this open, and it spends Cloudinary quota.
  if (!(await getSessionUser())) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const url = await saveUpload(file);
    if (!url) return NextResponse.json({ error: "No file received." }, { status: 400 });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload failed." }, { status: 400 });
  }
}
