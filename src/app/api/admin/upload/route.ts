import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/upload";

/** Receives the cropped image blob from ImageCropUpload and stores it. */
export async function POST(req: Request) {
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
