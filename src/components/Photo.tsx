import Scenery from "./Scenery";
import { isMediaUrl } from "@/lib/format";

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
  if (isMediaUrl(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src ?? undefined} alt={alt ?? ""} className={`${className ?? ""} object-cover`} />;
  }
  return <Scenery kind={kind} className={className} />;
}
