import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_PHOTOS = 10;
const ENTITY_TYPES = new Set(["destination", "guide", "accommodation", "hero"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityType = String(searchParams.get("entityType") ?? "");
  const entityId = Number(searchParams.get("entityId"));
  if (!ENTITY_TYPES.has(entityType) || !entityId) {
    return NextResponse.json({ error: "Invalid entity." }, { status: 400 });
  }
  const images = await prisma.galleryImage.findMany({
    where: { entityType, entityId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({ images, max: MAX_PHOTOS });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const entityType = String(body.entityType ?? "");
  const entityId = Number(body.entityId);
  const imageUrl = String(body.imageUrl ?? "");
  const caption = String(body.caption ?? "").trim() || null;
  const mediaType = body.mediaType === "video" ? "video" : "image";

  if (!ENTITY_TYPES.has(entityType) || !entityId) {
    return NextResponse.json({ error: "Invalid entity." }, { status: 400 });
  }
  if (!imageUrl.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 400 });
  }

  const count = await prisma.galleryImage.count({ where: { entityType, entityId } });
  if (count >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum of ${MAX_PHOTOS} items reached — delete one first.` }, { status: 409 });
  }

  const image = await prisma.galleryImage.create({
    data: { entityType, entityId, imageUrl, mediaType, caption, sortOrder: count },
  });
  return NextResponse.json({ image });
}

/** Update a slide's caption (and, if provided, its sort order). */
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const data: { caption?: string | null; sortOrder?: number } = {};
  if ("caption" in body) data.caption = String(body.caption ?? "").trim() || null;
  if ("sortOrder" in body) data.sortOrder = Number(body.sortOrder) || 0;

  const image = await prisma.galleryImage.update({ where: { id }, data }).catch(() => null);
  if (!image) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ image });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await prisma.galleryImage.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
