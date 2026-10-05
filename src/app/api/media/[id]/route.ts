import { prisma } from "@/lib/prisma";

// Streams an uploaded file stored in the Media table. The id is an unguessable
// cuid, so the long immutable cache is safe — a given id always maps to the same
// bytes. Falls through to 404 for unknown ids.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return new Response("Not found", { status: 404 });

  const body = new Uint8Array(media.data);
  return new Response(body, {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
