import { DeviceMobileIcon, ReceiptIcon, VanIcon, TimerIcon, PaletteIcon, ImagesIcon, FilmSlateIcon, SlidersIcon, InfoIcon, HandWavingIcon } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { peso } from "@/lib/format";
import { Field, TextInput, TextArea, Select, FormCard } from "@/components/admin/FormBits";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import HeroBannerManager from "@/components/admin/HeroBannerManager";
import { requireRole, MANAGER_ROLES } from "@/lib/auth";
import { saveFees, saveGcash, saveExpiry, saveBranding, saveHeroAppearance, saveWelcomePopup, addTransportRoute, toggleTransportRoute } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  // Fees and the GCash payout account live here — restricted to managers so a
  // front-desk or guide account cannot redirect where tourists send money.
  await requireRole(MANAGER_ROLES);

  const [muni, fees, routes] = await Promise.all([
    prisma.municipality.findUnique({ where: { id: 1 } }),
    prisma.feeSetting.findMany({ where: { municipalityId: 1 } }),
    prisma.transportRoute.findMany({ where: { municipalityId: 1 }, orderBy: { id: "asc" } }),
  ]);

  const fee = (code: string) => fees.find((f) => f.feeCode === code)?.amount ?? 0;

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">Settings</h1>
      <p className="text-sm text-ink-600">Fee rates, transportation modes, payment account, and booking rules — all changes take effect immediately.</p>

      <div className="mt-5 grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* BRANDING — makes the system deployable to any destination */}
        <form action={saveBranding} className="lg:col-span-2">
          <FormCard title="Site branding & information">
            <div className="flex items-center gap-2 text-brand-700"><PaletteIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">This system is multi-tenant ready — logo, name, and contact details here rebrand the whole public site instantly.</span></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Site name">
                <TextInput name="name" defaultValue={muni?.name ?? ""} required />
              </Field>
              <Field label="Province">
                <TextInput name="province" defaultValue={muni?.province ?? ""} />
              </Field>
              <Field label="Tagline" hint="Shown in the footer and hero">
                <TextInput name="tagline" defaultValue={muni?.tagline ?? ""} placeholder="e.g. Highlands of La Union" />
              </Field>
              <Field label="Contact number">
                <TextInput name="contactNumber" defaultValue={muni?.contactNumber ?? ""} />
              </Field>
              <Field label="Email">
                <TextInput name="email" defaultValue={muni?.email ?? ""} />
              </Field>
              <Field label="Office address">
                <TextInput name="address" defaultValue={muni?.address ?? ""} />
              </Field>
            </div>
            <Field label="Logo" hint="Transparent PNG supported — appears in the site header, footer, and admin sidebar.">
              <ImageCropUpload name="logoPath" mode="logo" initial={muni?.logoUrl} buttonLabel="Upload logo (PNG with transparency OK)" />
            </Field>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="heroLogoEnabled" defaultChecked={muni?.heroLogoEnabled ?? true} className="h-4 w-4 accent-brand-700" />
              Show the logo as a seal on the home banner
            </label>
            <button className="btn btn-green w-fit">Save branding</button>
          </FormCard>
        </form>

        {/* HERO BANNER — customizable home-page banner photos & videos */}
        <div className="lg:col-span-2">
          <FormCard title="Home page banner — photos & video">
            <div className="flex items-start gap-2 text-brand-700">
              <ImagesIcon size={20} weight="duotone" className="mt-0.5 shrink-0" />
              <span className="text-xs font-semibold text-ink-600">Mix up to 10 photos and videos. They auto-rotate; visitors can swipe. Each slide can have its own caption. With no media, the illustrated highland scene is shown instead.</span>
            </div>

            {/* Recommended format & resolution guidance */}
            <div className="rounded-card border border-river-100 bg-river-100/40 p-3 text-[12.5px] text-ink-700">
              <div className="mb-1.5 flex items-center gap-1.5 font-bold text-river-700">
                <InfoIcon size={15} weight="fill" /> Recommended format & resolution
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-0.5 flex items-center gap-1 font-semibold"><ImagesIcon size={13} weight="duotone" /> Photos</div>
                  <ul className="ml-4 list-disc space-y-0.5 text-ink-600">
                    <li><b>1920 × 1080</b> (16:9) landscape, or wider</li>
                    <li>JPG / WEBP · sharp, well-lit, minimal text</li>
                    <li>Under <b>8 MB</b> each</li>
                  </ul>
                </div>
                <div>
                  <div className="mb-0.5 flex items-center gap-1 font-semibold"><FilmSlateIcon size={13} weight="duotone" /> Videos</div>
                  <ul className="ml-4 list-disc space-y-0.5 text-ink-600">
                    <li><b>MP4</b> (H.264) or WebM · <b>1920 × 1080</b>, 16:9</li>
                    <li><b>8–20 s</b>, 24–30 fps · plays muted &amp; loops</li>
                    <li>Landscape · under <b>40 MB</b> (compress if larger)</li>
                  </ul>
                </div>
              </div>
            </div>

            <HeroBannerManager entityId={1} />
          </FormCard>
        </div>

        {/* HERO APPEARANCE — timing, transitions, captions */}
        <form action={saveHeroAppearance} className="lg:col-span-2">
          <FormCard title="Banner appearance & motion">
            <div className="flex items-center gap-2 text-brand-700"><SlidersIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Control how the banner behaves — how long each slide shows, how it transitions, and whether captions appear.</span></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Slide duration (seconds)" hint="How long each photo/video stays (2–20s)">
                <TextInput type="number" name="heroIntervalMs" min={2} max={20} step="0.5" defaultValue={(muni?.heroIntervalMs ?? 5000) / 1000} />
              </Field>
              <Field label="Transition style">
                <Select name="heroTransition" defaultValue={muni?.heroTransition ?? "fade"}>
                  <option value="fade">Cross-fade (smooth)</option>
                  <option value="slide">Slide across</option>
                  <option value="zoom">Zoom / Ken Burns</option>
                </Select>
              </Field>
              <Field label="Transition speed (ms)" hint="200–2000ms">
                <TextInput type="number" name="heroTransitionMs" min={200} max={2000} step="50" defaultValue={muni?.heroTransitionMs ?? 700} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="heroCaptionsEnabled" defaultChecked={muni?.heroCaptionsEnabled ?? true} className="h-4 w-4 accent-brand-700" />
              Show captions on the banner
            </label>
            <button className="btn btn-green w-fit">Save banner appearance</button>
          </FormCard>
        </form>

        {/* WELCOME POPUP — first-visit greeting */}
        <form action={saveWelcomePopup} className="lg:col-span-2">
          <FormCard title="Welcome popup">
            <div className="flex items-center gap-2 text-brand-700"><HandWavingIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Greets first-time visitors once per browser session. Leave the heading or message blank to use the default copy.</span></div>
            <Field label="Background photo" hint="Fills the popup header. Leave unset to use the plain brand-green header instead.">
              <ImageCropUpload name="welcomePhotoPath" mode="wide" initial={muni?.welcomePhotoUrl} buttonLabel="Upload welcome photo" />
            </Field>
            <Field label="Heading" hint={'Default: "Maligayang pagdating! Welcome to ePassyar"'}>
              <TextInput name="welcomeHeading" defaultValue={muni?.welcomeHeading ?? ""} placeholder="Maligayang pagdating! Welcome to ePassyar" />
            </Field>
            <Field label="Message" hint="Default describes planning a visit, booking guides, and browsing products.">
              <TextArea name="welcomeMessage" rows={3} defaultValue={muni?.welcomeMessage ?? ""} placeholder={`Plan your visit to ${muni?.name ?? "Bagulin"}, reserve guided tours to waterfalls, caves and viewdecks, and bring home local products — all in one place.`} />
            </Field>
            <button className="btn btn-green w-fit">Save welcome popup</button>
          </FormCard>
        </form>

        {/* FEES */}
        <form action={saveFees}>
          <FormCard title="Fee rates">
            <div className="flex items-center gap-2 text-brand-700"><ReceiptIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Set your fee rates — used by the pricing engine on every quote.</span></div>
            <Field label="Environmental fee (₱ per pax)">
              <TextInput type="number" name="environmental" min={0} step="0.01" defaultValue={fee("ENVIRONMENTAL")} />
            </Field>
            <Field label="Tourist insurance (₱ per pax per day)">
              <TextInput type="number" name="insurance" min={0} step="0.01" defaultValue={fee("INSURANCE")} />
            </Field>
            <Field label="Reservation fee (% of total)" hint="Paid upfront to confirm a booking; balance is collected on arrival">
              <TextInput type="number" name="reservation" min={1} max={100} defaultValue={fee("RESERVATION")} />
            </Field>
            <button className="btn btn-green w-fit">Save fee rates</button>
          </FormCard>
        </form>

        {/* GCASH */}
        <form action={saveGcash}>
          <FormCard title="GCash payment account">
            <div className="flex items-center gap-2 text-brand-700"><DeviceMobileIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Tourists send the reservation fee here, then submit their GCash reference number for verification.</span></div>
            <Field label="Account name (shown to tourists)">
              <TextInput name="gcashName" defaultValue={muni?.gcashName ?? ""} placeholder="e.g. ePassyar Bagulin" />
            </Field>
            <Field label="GCash number">
              <TextInput name="gcashNumber" defaultValue={muni?.gcashNumber ?? ""} placeholder="09xx xxx xxxx" />
            </Field>
            <Field label="GCash QR code" hint="Crop the QR square and preview exactly how tourists will see and scan it before saving.">
              <ImageCropUpload name="qrPath" mode="qr" initial={muni?.gcashQrUrl} buttonLabel="Upload GCash QR" />
            </Field>
            <button className="btn btn-green w-fit">Save GCash settings</button>
          </FormCard>
        </form>

        {/* EXPIRY */}
        <form action={saveExpiry}>
          <FormCard title="Booking rules">
            <div className="flex items-center gap-2 text-brand-700"><TimerIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Anti-prank protection: unpaid reservations release their slots automatically.</span></div>
            <Field label="Unpaid reservation expiry (hours)">
              <TextInput type="number" name="hours" min={1} max={168} defaultValue={muni?.reservationExpiryHours ?? 24} />
            </Field>
            <button className="btn btn-green w-fit">Save booking rules</button>
          </FormCard>
        </form>

        {/* TRANSPORT */}
        <div className="grid gap-4">
          <FormCard title="Transportation modes & rates">
            <div className="flex items-center gap-2 text-brand-700"><VanIcon size={20} weight="duotone" /><span className="text-xs font-semibold text-ink-600">Offered as add-ons in the itinerary builder. Set fee per pax OR per trip.</span></div>
            <div className="space-y-2">
              {routes.map((r) => (
                <div key={r.id} className={`flex items-center justify-between rounded-btn border border-line px-3 py-2 text-sm ${r.isActive ? "" : "opacity-50"}`}>
                  <div>
                    <div className="font-semibold">{r.routeName}</div>
                    <div className="text-xs text-ink-600">
                      {r.vehicleType} · {r.feePerPax ? `${peso(r.feePerPax)}/pax` : r.feePerTrip ? `${peso(r.feePerTrip)}/trip (max ${r.maxPaxPerTrip ?? "—"} pax)` : "no fee set"}
                    </div>
                  </div>
                  <form action={toggleTransportRoute}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className={`pill border ${r.isActive ? "border-line bg-white text-ink-600" : "border-brand-700 bg-brand-100 text-brand-700"}`}>
                      {r.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </FormCard>

          <form action={addTransportRoute}>
            <FormCard title="Add transport route">
              <Field label="Route name">
                <TextInput name="routeName" required placeholder="e.g. Town Proper ↔ Brgy. Cardiz" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Vehicle type">
                  <Select name="vehicleType" defaultValue="Habal-habal">
                    <option>Habal-habal</option>
                    <option>Tricycle</option>
                    <option>Jeepney</option>
                    <option>Van</option>
                  </Select>
                </Field>
                <Field label="Max pax per trip (for per-trip fee)">
                  <TextInput type="number" name="maxPaxPerTrip" min={1} placeholder="e.g. 10" />
                </Field>
                <Field label="Fee per pax (₱)" hint="Leave 0 if charging per trip">
                  <TextInput type="number" name="feePerPax" min={0} step="0.01" defaultValue={0} />
                </Field>
                <Field label="Fee per trip (₱)" hint="Leave 0 if charging per pax">
                  <TextInput type="number" name="feePerTrip" min={0} step="0.01" defaultValue={0} />
                </Field>
              </div>
              <button className="btn btn-amber w-fit">Add route</button>
            </FormCard>
          </form>
        </div>
      </div>
    </>
  );
}
