import Link from "next/link";
import {
  MagnifyingGlassIcon,
  WavesIcon,
  BankIcon,
  BinocularsIcon,
  PersonSimpleHikeIcon,
  TreeIcon,
  SealCheckIcon,
  UserCircleCheckIcon,
  DeviceMobileIcon,
  QrCodeIcon,
  ArrowRightIcon,
  MapPinIcon,
  CalendarBlankIcon,
  UsersThreeIcon,
  CheckCircleIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroCarousel from "@/components/HeroCarousel";
import WelcomeModal from "@/components/WelcomeModal";
import { DestinationCard, PackageCard } from "@/components/cards";
import { isMediaUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const defaultDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  const [destinations, packages, heroImages, muni] = await Promise.all([
    prisma.destination.findMany({ where: { status: "active" }, orderBy: { id: "asc" } }),
    prisma.tourPackage.findMany({
      where: { status: "active" },
      include: { destinations: { include: { destination: true }, orderBy: { visitOrder: "asc" } } },
      orderBy: { id: "asc" },
    }),
    prisma.galleryImage.findMany({ where: { entityType: "hero" }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 10 }),
    prisma.municipality.findUnique({ where: { id: 1 } }),
  ]);

  const heroSlides = heroImages.map((h) => ({
    url: h.imageUrl,
    caption: h.caption,
    mediaType: (h.mediaType === "video" ? "video" : "image") as "image" | "video",
  }));

  return (
    <>
      <SiteHeader />
      <WelcomeModal municipalityName={muni?.name ?? "Bagulin"} tagline={muni?.tagline} />

      {/* HERO */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0">
          {heroSlides.length > 0 ? (
            <HeroCarousel
              slides={heroSlides}
              intervalMs={muni?.heroIntervalMs ?? 5000}
              transition={(muni?.heroTransition as "fade" | "slide" | "zoom") ?? "fade"}
              transitionMs={muni?.heroTransitionMs ?? 700}
              captionsEnabled={muni?.heroCaptionsEnabled ?? true}
            />
          ) : (
            <>
              <HeroScene />
              <div className="absolute inset-0 bg-black/15" />
            </>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />

        {/* Official LGU seal — shown only when a logo is uploaded AND enabled in
            admin settings. Sits centered near the top of the banner. */}
        {muni?.heroLogoEnabled && isMediaUrl(muni?.logoUrl) && (
          <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex justify-center sm:top-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={muni!.logoUrl!}
              alt={`${muni?.name ?? "Municipality"} official seal`}
              className="h-20 w-20 object-contain drop-shadow-lg sm:h-24 sm:w-24"
            />
          </div>
        )}

        <div className="relative flex min-h-[430px] flex-col justify-center py-12 sm:py-14">
          <div className="wrap reveal">
            <span className="glass mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              <SealCheckIcon size={13} weight="fill" /> Official LGU {muni?.name ?? "Bagulin"} · La Union
            </span>
            <h1 className="max-w-2xl text-balance font-display text-[2rem] font-extrabold leading-[1.08] drop-shadow-lg md:text-[2.6rem]">
              {muni?.tagline ?? "Discover the Highlands of La Union"}
            </h1>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-white/90 drop-shadow-md">
              Waterfalls, heritage caves, hanging bridges and pine-cooled viewdecks — guided by{" "}
              {muni?.name ?? "Bagulin"}&apos;s own accredited community tour guides.
            </p>

          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="bg-ink-900 text-[12px] text-[#B4B9C0]">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-1 py-2.5">
          <Trust icon={<SealCheckIcon size={13} weight="fill" className="text-brand-400" />} text={<><b className="text-white">Official LGU</b> reservation</>} />
          <Trust icon={<DeviceMobileIcon size={13} weight="duotone" className="text-river-300" />} text={<>Pay via <b className="text-white">GCash · Maya · Card</b></>} />
          <span className="hidden sm:contents">
            <Trust icon={<UserCircleCheckIcon size={13} weight="duotone" className="text-cta-400" />} text={<><b className="text-white">22 accredited</b> guides</>} />
            <Trust icon={<QrCodeIcon size={13} weight="duotone" className="text-brand-400" />} text={<><b className="text-white">QR pass</b> by SMS</>} />
          </span>
        </div>
      </div>

      {/* SEARCH BAR STRIP */}
      <div className="border-b border-line bg-white py-5 shadow-sm">
        <div className="wrap">
          <form action="/build" method="get" className="flex flex-col gap-1 rounded-2xl border border-line bg-bg p-1.5 shadow-sm sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full">
            <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-brand-50">
              <span className="shrink-0 text-brand-600"><CalendarBlankIcon size={16} weight="duotone" /></span>
              <label className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">Visit date</span>
                <input type="date" name="date" defaultValue={defaultDate} min={minDate}
                  className="block w-full bg-transparent text-[13.5px] font-semibold text-ink-900 focus:outline-none" />
              </label>
            </div>
            <div className="flex flex-1 items-center gap-2 border-t border-line px-4 py-2 transition-colors hover:bg-brand-50 sm:border-l sm:border-t-0">
              <span className="shrink-0 text-brand-600"><UsersThreeIcon size={16} weight="duotone" /></span>
              <label className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">Travelers</span>
                <input type="number" name="pax" defaultValue={2} min={1} max={50}
                  className="block w-full bg-transparent text-[13.5px] font-semibold text-ink-900 focus:outline-none [appearance:textfield]" />
              </label>
            </div>
            <div className="flex flex-1 items-center gap-2 border-t border-line px-4 py-2 transition-colors hover:bg-brand-50 sm:border-l sm:border-t-0">
              <span className="shrink-0 text-brand-600"><MapPinIcon size={16} weight="duotone" /></span>
              <label className="min-w-0 flex-1 cursor-pointer">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-500">Destination</span>
                <select name="add" className="block w-full bg-transparent text-[13.5px] font-semibold text-ink-900 focus:outline-none">
                  <option value="">Anywhere in Bagulin</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="m-0.5 flex items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-3 font-display text-[13.5px] font-extrabold text-cta-ink shadow-sm transition-all hover:-translate-y-0.5 hover:bg-cta-600 sm:rounded-full">
              <MagnifyingGlassIcon size={16} weight="bold" /> Plan a Visit
            </button>
          </form>

          {/* Category filter chips — geometric equal-width icon cards */}
          <div className="mt-4 flex gap-2">
            <FilterChip icon={<WavesIcon size={18} weight="duotone" />} label="Waterfalls" />
            <FilterChip icon={<BankIcon size={18} weight="duotone" />} label="Heritage" />
            <FilterChip icon={<BinocularsIcon size={18} weight="duotone" />} label="Viewpoints" />
            <FilterChip icon={<PersonSimpleHikeIcon size={18} weight="duotone" />} label="Adventure" />
            <FilterChip icon={<TreeIcon size={18} weight="duotone" />} label="Parks" />
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="wrap pt-14">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">Simple Process</span>
          <h2 className="font-display text-[1.45rem] font-bold text-ink-900">How It Works</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-ink-600">
            From choosing a destination to standing at the trailhead — four easy steps.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HowStep n={1} icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
            title="Choose Your Tour"
            body="Browse official LGU packages or build a custom itinerary by picking any combination of destinations." />
          <HowStep n={2} icon={<CalendarBlankIcon size={22} weight="duotone" />}
            title="Set Date & Group Size"
            body="Select your visit date and how many are joining. Live capacity shows slots remaining per site." />
          <HowStep n={3} icon={<SealCheckIcon size={22} weight="duotone" />}
            title="Reserve with 20% Down"
            body="Secure your slot with just 20% of the total. Pay the balance in cash when you arrive." />
          <HowStep n={4} icon={<QrCodeIcon size={22} weight="duotone" />}
            title="Get Your QR Pass"
            body="A digital QR pass is sent to your mobile via SMS. Show it at each site — no printout needed." />
        </div>
      </section>

      {/* PACKAGES */}
      <Section
        title="Official Tour Packages"
        sub="Pre-planned by the Municipal Tourism Office — guide, fees & insurance included"
        href="/packages"
        linkLabel="View all"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {packages.map((p, i) => (
            <PackageCard key={p.id} p={p} slotsLeft={[8, 12, 6][i] ?? p.maxPax} />
          ))}
        </div>

        {/* Slim Build-your-own CTA */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <span className="text-[13.5px] font-semibold text-brand-800">Want to choose your own stops?</span>
            <span className="ml-1.5 hidden text-[13px] text-ink-600 sm:inline">Build a custom itinerary — every fee is itemised before you pay.</span>
          </div>
          <Link href="/build" className="btn btn-outline w-full shrink-0 justify-center text-[13px] sm:w-auto">
            Build your own <ArrowRightIcon size={14} weight="bold" />
          </Link>
        </div>
      </Section>

      {/* DESTINATIONS */}
      <Section
        title="Officially Declared Tourist Destinations"
        sub={`${destinations.length} sites across the barangays of Bagulin — live daily capacity on every site`}
        href="/destinations"
        linkLabel="Explore all"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <DestinationCard key={d.id} d={d} />
          ))}
        </div>
      </Section>

      {/* WHY EPASSYAR */}
      <section className="wrap pt-14">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-700">Why ePassyar</span>
          <h2 className="font-display text-[1.45rem] font-bold text-ink-900">One Platform, Every Problem Solved</h2>
          <p className="mx-auto mt-1.5 max-w-lg text-[13.5px] text-ink-600">
            Informal bookings, overcrowded sites, unlicensed guides — ePassyar was built to fix all of it.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Tourists */}
          <div className="rounded-card border border-line bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <UsersThreeIcon size={20} weight="duotone" />
              </span>
              <div>
                <h3 className="font-display text-[15px] font-bold text-ink-900">For Tourists</h3>
                <p className="text-[12px] text-ink-600">Plan with confidence, arrive without hassle</p>
              </div>
            </div>
            <ul className="space-y-3.5">
              {[
                ["No more walk-in uncertainty", "Reserve your slot days ahead — no risk of being turned away at the gate."],
                ["100% transparent pricing", "Every entrance fee, guide fee, and charge is itemised before you pay a single peso."],
                ["Accredited local guides", "Every guide is LGU-certified, trained, and covered — your safety is not negotiable."],
                ["Digital QR pass via SMS", "No app to install. Your pass arrives by text and works offline at every checkpoint."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-ok" />
                  <span className="text-[13.5px]">
                    <b className="text-ink-900">{title}</b>
                    <span className="text-ink-600"> — {desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* LGU */}
          <div className="rounded-card border border-line bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canopy/10 text-brand-800">
                <ChartLineUpIcon size={20} weight="duotone" />
              </span>
              <div>
                <h3 className="font-display text-[15px] font-bold text-ink-900">For LGU Officials</h3>
                <p className="text-[12px] text-ink-600">Organized records, full visibility, zero guesswork</p>
              </div>
            </div>
            <ul className="space-y-3.5">
              {[
                ["Live capacity enforcement", "Set daily visitor limits per site. The system blocks overbooking automatically."],
                ["Complete visitor records", "Every booking logs name, date, group size, origin, and fees — always audit-ready."],
                ["Guide & revenue tracking", "See which guides are assigned, how many tours ran, and total income collected."],
                ["Instant QR check-in", "Scan a tourist's QR pass at the gate — verify identity and mark attendance in seconds."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <CheckCircleIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-ok" />
                  <span className="text-[13.5px]">
                    <b className="text-ink-900">{title}</b>
                    <span className="text-ink-600"> — {desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="h-14" />
      <SiteFooter />
    </>
  );
}

/* ---------- layout pieces ---------- */

function Section({
  title, sub, href, linkLabel, children,
}: {
  title: string; sub: string; href?: string; linkLabel?: string; children: React.ReactNode;
}) {
  return (
    <section className="wrap pt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-[1.35rem] font-bold leading-tight text-ink-900">{title}</h2>
          <div className="mt-1 text-[13px] leading-relaxed text-ink-600">{sub}</div>
        </div>
        {href && (
          <Link
            href={href}
            className="group hidden shrink-0 items-center gap-1.5 rounded-full border border-brand-200 px-4 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 sm:inline-flex"
          >
            {linkLabel} <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}


function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 py-2 text-brand-600 transition-colors hover:text-brand-900">
      {icon}
      <span className="text-center text-[10px] font-bold leading-none text-ink-700">{label}</span>
    </span>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{icon} {text}</span>;
}

function HowStep({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-card">
      <div className="mb-3 flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </span>
        <span className="font-display text-[3rem] font-extrabold leading-none text-brand-100 select-none">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <h3 className="font-display text-[15px] font-bold text-ink-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{body}</p>
    </div>
  );
}

function HeroScene() {
  const pines = [90, 155, 225, 300, 1160, 1230, 1300, 1360];
  return (
    <svg viewBox="0 0 1440 470" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc6ef" /><stop offset=".45" stopColor="#bfe8de" /><stop offset="1" stopColor="#eaf6e2" />
        </linearGradient>
        <radialGradient id="h-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6d0" /><stop offset=".5" stopColor="#ffdf8a" stopOpacity=".55" /><stop offset="1" stopColor="#ffdf8a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="h-m1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b7a44" /><stop offset="1" stopColor="#0C330F" /></linearGradient>
        <linearGradient id="h-m2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#57945d" /><stop offset="1" stopColor="#256A2A" /></linearGradient>
        <linearGradient id="h-m3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fc090" /><stop offset="1" stopColor="#4c8352" /></linearGradient>
      </defs>
      <rect width="1440" height="470" fill="url(#h-sky)" />
      <circle cx="1180" cy="120" r="220" fill="url(#h-sun)" />
      <circle cx="1180" cy="120" r="44" fill="#fff6d0" opacity=".95" />
      <g fill="#ffffff" opacity=".55">
        <ellipse cx="360" cy="90" rx="70" ry="20" /><ellipse cx="420" cy="80" rx="55" ry="18" />
        <ellipse cx="860" cy="60" rx="60" ry="17" /><ellipse cx="910" cy="52" rx="44" ry="14" />
      </g>
      <path d="M0,300 L200,170 L370,260 L520,150 L700,280 L900,140 L1080,250 L1260,160 L1440,270 L1440,470 L0,470 Z" fill="url(#h-m3)" opacity=".7" />
      <path d="M0,340 L160,230 L340,310 L560,200 L760,320 L980,210 L1200,310 L1440,230 L1440,470 L0,470 Z" fill="url(#h-m2)" />
      <path d="M0,400 L240,290 L460,375 L720,270 L950,385 L1180,290 L1440,375 L1440,470 L0,470 Z" fill="url(#h-m1)" />
      <path d="M690,275 q6,70 -12,125 q28,-18 34,-64 q10,46 26,64 q-14,-62 -8,-125 Z" fill="#eaf9ff" opacity=".9" />
      <ellipse cx="700" cy="404" rx="70" ry="10" fill="#dff3ff" opacity=".6" />
      <g fill="#0C330F">
        {pines.map((x, i) => {
          const h = 120 + ((i * 13) % 46);
          const w = 26;
          return (
            <path key={x} d={`M${x} 470 L${x} ${470 - h} M${x - w} 470 L${x} ${470 - h + 20} L${x + w} 470 Z M${x - w + 6} 438 L${x} ${470 - h + 6} L${x + w - 6} 438 Z`} stroke="#0C330F" strokeWidth="5" />
          );
        })}
      </g>
      <rect y="360" width="1440" height="110" fill="rgba(10,40,15,.30)" />
    </svg>
  );
}
