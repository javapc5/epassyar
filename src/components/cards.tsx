import Link from "next/link";
import {
  MapPinIcon,
  StarIcon,
  PersonSimpleHikeIcon,
  ClockIcon,
  ArrowRightIcon,
  BasketIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Photo from "./Photo";
import ShareButton from "./ShareButton";
import AddToCartButton from "./AddToCartButton";
import { peso, parseList, isMediaUrl, unitPrice, productAvailability } from "@/lib/format";

const AVAIL_TONE: Record<string, string> = {
  ok: "bg-ok/15 text-ok",
  warn: "bg-amber-100 text-amber-800",
  off: "bg-ink-100 text-ink-500",
};

export function DestinationCard({ d }: { d: any }) {
  const acts = parseList(d.activities);
  return (
    <div className="card card-hover group relative">
      <Link href={`/destinations/${d.id}`} className="contents">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Photo src={d.mainImage} kind={d.category} alt={d.name} className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <span className="pill absolute bottom-2.5 left-2.5 bg-white/90 text-ink-700">{d.category}</span>
        </div>
        <div className="p-5">
          <h4 className="font-display text-[15px] font-bold leading-tight">{d.name}</h4>
          <div className="mt-1 flex items-center gap-1 text-xs text-ink-600">
            <MapPinIcon size={13} /> Brgy. {d.barangay}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {acts.slice(0, 2).map((a) => (
              <span key={a} className="chip">{a}</span>
            ))}
            {d.guideRequired && (
              <span className="pill bg-[#fff3d6] text-[#8a6100]">
                <PersonSimpleHikeIcon size={12} weight="fill" /> Guide required
              </span>
            )}
          </div>
        </div>
      </Link>
      <ShareButton
        variant="icon"
        title={d.name}
        text={`${d.name} — Brgy. ${d.barangay}, Bagulin`}
        path={`/destinations/${d.id}`}
        className="absolute right-2.5 top-2.5 z-10"
      />
    </div>
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
      <div className="flex flex-1 flex-col gap-2 p-5">
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
  const hasPhoto = isMediaUrl(g.photoUrl);
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

/**
 * Shared product tile — used by the products catalog (default + featured) and
 * the smaller BookingAddOns strip (compact), so every product reads at a
 * consistent size across the site instead of three hand-tuned duplicates.
 */
export function ProductCard({ p, featured, compact }: { p: any; featured?: boolean; compact?: boolean }) {
  const avail = productAvailability(p);
  return (
    <div className={`card card-hover group relative flex flex-col ${featured ? "ring-1 ring-brand-200" : ""}`}>
      <Link href={`/products/${p.id}`} className="contents">
        <div className={`relative overflow-hidden bg-gradient-to-br from-ink-100 to-[#E1E4E8] ${compact ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
          {isMediaUrl(p.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image!} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BasketIcon size={compact ? 26 : 40} weight="duotone" className="text-ink-400" />
            </div>
          )}
        </div>
        <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-5"}`}>
          {p.category && <span className="chip mb-1.5 w-fit">{p.category}</span>}
          <h4 className={`font-display font-bold leading-tight ${compact ? "text-[14px]" : "text-[15px]"}`}>{p.name}</h4>
          {!compact && p.description && <p className="mt-1 line-clamp-2 text-[13px] text-ink-600">{p.description}</p>}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-600">
            {p.ratingCount > 0 && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-ink-900">
                <StarIcon size={12} weight="fill" className="text-cta-500" /> {p.ratingAvg.toFixed(1)}
                {!compact && <span className="font-normal text-ink-500">({p.ratingCount})</span>}
              </span>
            )}
            {!compact && p.producer && <span className="truncate">· {p.producer}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className={`font-display font-extrabold text-brand-700 ${compact ? "text-sm" : "text-base"}`}>{unitPrice(p.price, p.unit)}</span>
            {!compact && <span className={`pill ${AVAIL_TONE[avail.tone]}`}>{avail.label}</span>}
          </div>
        </div>
      </Link>
      <div className={compact ? "px-3 pb-3" : "px-5 pb-5"}>
        <AddToCartButton
          product={{ id: p.id, name: p.name, image: isMediaUrl(p.image) ? p.image : null, price: p.price, unit: p.unit }}
          disabled={!avail.ok}
          disabledLabel={avail.label}
          className={`w-full justify-center ${compact ? "!py-1 !text-[11px]" : ""}`}
        />
      </div>
      {featured && (
        <span className="pill absolute left-3 top-3 z-10 bg-cta-500 text-cta-ink shadow-sm">
          <SparkleIcon size={12} weight="fill" /> Featured
        </span>
      )}
      {!compact && (
        <ShareButton
          variant="icon"
          title={p.name}
          text={`${p.name} — ${unitPrice(p.price, p.unit)}`}
          path={`/products/${p.id}`}
          className="absolute right-3 top-3 z-10"
        />
      )}
    </div>
  );
}
