import Scenery from "./Scenery";

/**
 * Renders an uploaded photo when one exists (src starts with "/uploads/"),
 * otherwise falls back to the illustrated SVG scenery for the category.
 * This is what makes admin photo uploads appear across the whole site.
 */
export default function Photo({
  src,
  kind,
  alt,
  className,
}: {
  src?: string | null;
  kind: string;
  alt?: string;
  className?: string;
}) {
  if (src && src.startsWith("/uploads/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ""} className={`${className ?? ""} object-cover`} />;
  }
  return <Scenery kind={kind} className={className} />;
}
