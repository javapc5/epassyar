import Link from "next/link";
import {
  MapPinIcon,
  StarIcon,
  PersonSimpleHikeIcon,
  ClockIcon,
  ImagesIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Photo from "./Photo";
import { peso, parseList } from "@/lib/format";

export function DestinationCard({ d, gallery }: { d: any; gallery?: string[] }) {
  const acts = parseList(d.activities);
  const thumbs = gallery ?? [];
  return (
    <Link href={`/destinations/${d.id}`} className="card card-hover group block">
      <div className="relative h-40 overflow-hidden sm:h-36">
        <Photo src={d.mainImage} kind={d.category} alt={d.name} className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        <span className="pill absolute bottom-2.5 left-2.5 bg-white/90 text-brand-700">{d.category}</span>
        {thumbs.length > 0 && (
          <span className="pill absolute right-2.5 top-2.5 bg-black/55 text-white">
            <ImagesIcon size={12} weight="fill" /> {thumbs.length}
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-display text-[15px] font-bold leading-tight">{d.name}</h4>
        <div className="mt-1 flex items-center gap-1 text-xs text-ink-600">
          <MapPinIcon size={13} /> Brgy. {d.barangay}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {acts.slice(0, 2).map((a) => (
            <span key={a} className="rounded-full bg-[#f0f4ef] px-2 py-0.5 text-[10.5px] font-semibold text-[#41564a]">
              {a}
            </span>
          ))}
          {d.guideRequired && (
            <span className="pill bg-[#fff3d6] text-[#8a6100]">
              <PersonSimpleHikeIcon size={12} weight="fill" /> Guide required
            </span>
          )}
        </div>
        {thumbs.length > 0 && (
          <div className="mt-2.5 flex gap-1.5">
            {thumbs.slice(0, 4).map((t, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={t} alt="" className="h-10 w-1/4 rounded-md object-cover" />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function PackageCard({ p, slotsLeft }: { p: any; slotsLeft?: number }) {
  const inclusions = parseList(p.inclusions) as any[];
  const included = (Array.isArray(inclusions) ? inclusions : []).filter((i: any) => i.included);
  return (
    <div className="card card-hover group flex flex-col">
      <div className="relative h-[180px] overflow-hidden">
        <Photo src={p.mainImage} kind={p.mainImage?.includes("heritage") ? "cave" : p.mainImage?.includes("adventure") ? "adventure" : "falls"} alt={p.name} className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <span className="pill absolute left-3 top-3 bg-black/55 text-white"><ClockIcon size={12} weight="fill" /> {p.durationLabel}</span>
        {typeof slotsLeft === "number" && (
          <span className="pill absolute right-3 top-3 bg-cta-500 text-cta-ink">{slotsLeft} slots left</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-[15px] font-bold leading-tight">{p.name}</h3>
        <div className="text-[13px] text-ink-600">
          {p.destinations?.map((pd: any) => pd.destination.name).join(" → ")}
        </div>
        <div className="flex items-center gap-1 text-[13px] font-bold text-cta-700">
          <StarIcon size={14} weight="fill" /> 4.8 <span className="font-medium text-ink-600">(new)</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {included.slice(0, 4).map((i: any) => (
            <span key={i.label} className="chip">{i.label}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-dashed border-line pt-3">
          <div>
            <span className="block text-[11.5px] font-semibold text-ink-600">From</span>
            <b className="font-display text-lg text-brand-700">
              {peso(p.pricePerPax)} <em className="text-xs font-semibold not-italic text-ink-600">/ person</em>
            </b>
          </div>
          <Link href={`/packages/${p.slug}`} className="btn btn-green">Book Now <ArrowRightIcon size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" /></Link>
        </div>
      </div>
    </div>
  );
}

export function GuideCard({ g }: { g: any }) {
  const specialties = parseList(g.specialties);
  const initials = g.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
  const colors = ["#2e7d32", "#0277BD", "#8a6100", "#6a1b9a", "#00695c"];
  const color = colors[g.id % colors.length];
  const hasPhoto = g.photoUrl?.startsWith("/uploads/");
  return (
    <Link href={`/guides/${g.id}`} className="card card-hover group block overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden bg-brand-100">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.photoUrl} alt={g.fullName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: `${color}18` }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold text-white" style={{ background: color }}>{initials}</div>
          </div>
        )}
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10.5px] font-bold text-white">
          <StarIcon size={10} weight="fill" className="text-cta-500" /> {g.ratingCount > 0 ? g.ratingAvg.toFixed(1) : "New"}
        </div>
      </div>
      <div className="p-2.5">
        <h4 className="truncate font-display text-[13px] font-bold leading-tight">{g.fullName}</h4>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-600">
          <MapPinIcon size={11} /> Brgy. {g.barangay}
        </div>
      </div>
    </Link>
  );
}
