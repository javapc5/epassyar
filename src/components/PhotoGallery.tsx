import { prisma } from "@/lib/prisma";
import { ImagesIcon } from "@phosphor-icons/react/dist/ssr";
import GalleryGrid from "./GalleryGrid";

/** Public photo gallery (up to 10) for a destination, guide, or homestay — browsable. */
export default async function PhotoGallery({ entityType, entityId, title = "Photos" }: { entityType: string; entityId: number; title?: string }) {
  const images = await prisma.galleryImage.findMany({
    where: { entityType, entityId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 10,
  });
  if (images.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <ImagesIcon size={20} weight="duotone" className="text-brand-700" /> {title}
        <span className="text-sm font-medium text-ink-600">({images.length})</span>
      </h3>
      <GalleryGrid images={images.map((i) => ({ imageUrl: i.imageUrl, caption: i.caption }))} />
    </div>
  );
}
