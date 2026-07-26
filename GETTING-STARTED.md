# Getting Started — Bagulin Smart Tourism (Working App)

This repository now contains a **working Next.js application**, not just the design docs.

## Requirements
- Node.js 20+ (built and tested on Node 24)
- npm

## Run it locally

```bash
npm install            # install dependencies
npm run db:reset       # create the SQLite database and seed Bagulin data
npm run dev            # start the dev server
```

Open **http://localhost:3000**.

The app uses **SQLite** locally (file: `prisma/dev.db`) so it runs with zero database setup.
For production, switch `prisma/schema.prisma` `datasource` provider to `postgresql`, point
`DATABASE_URL` at a Postgres instance, and run `npx prisma migrate deploy`.

## What works right now

### Public / tourist site
- **Home** (`/`) — hero + search, tour packages, itinerary-builder promo, all 8 destinations, guides, products
- **Destinations** (`/destinations`, `/destinations/[id]`) — detail pages with live availability
- **Packages** (`/packages`, `/packages/[slug]`) — inclusions, day plan, date + pax booking
- **Build Itinerary** (`/build`) — pick destinations, **live server-side cost breakdown**, capacity checks, reserve
- **Guides** (`/guides`, `/guides/[id]`) — all 22 accredited guides
- **Products** (`/products`) and **Where to Stay** (`/stay`, recommendations only)
- **Booking** (`/booking/[code]`) — status tracker, cost breakdown, pay reservation fee, **QR tourist pass**
- **My Booking** (`/my-booking`) — look up by reference

### Admin portal (`/admin`)
- **Dashboard** — arrivals, pending approvals, revenue MTD, guides on duty, approval queue, duty roster, **capacity heatmap**
- **Bookings** — filterable list + detail with **approve + mandatory guide assignment** (smart-ranked suggestions) and SMS log
- **Destinations / Guides** — management tables
- **Analytics** — booking funnel, destination popularity, visitor origins (feeds DOT arrival reports)

### End-to-end flow that works today
Build itinerary → reserve → pay reservation fee (simulated PayMongo) → booking becomes
`pending_approval` → admin approves & assigns a guide → QR pass issued + SMS queued to
tourist and guide → booking shows `approved` with the pass.

## Content management (admin)
Everything is editable from the admin portal — no developer needed:
- **Photo crop & preview on every upload** — choosing a photo opens a crop editor (drag to
  reposition, pinch/slide to zoom — works on mobile and desktop). You preview exactly how the
  photo will look on desktop and mobile cards *before* saving. The GCash QR gets a dedicated
  square crop with a "this is how tourists will scan it" preview.
- **Photo galleries (max 10) — browsable** — destinations, guide profiles, and homestays each
  hold up to 10 photos, managed on their edit pages. On public pages, tapping any gallery photo
  opens a **full-screen lightbox** to browse the whole collection (arrows, swipe, dot nav,
  keyboard, Esc to close).
- **Guide profiles** — each guide has a large **portrait (3:4) full-body photo** and an **About**
  section, plus a browsable tour-photo gallery. Guide cards are photo-forward (portrait cover +
  rating badge). Upload the full-body photo on the guide's edit page (portrait crop with preview).
- **Homestays** (`/admin/stay`) — add/edit listings (recommendations only, never in the
  payment flow) with cover photo + up to 10 service photos.
- **Municipality branding** (`/admin/settings`) — **logo (transparent PNG supported** — saved as
  PNG so a transparent seal shows with no background box; previewed on both light and dark),
  name, province, tagline, contact number, email, and address. The public header, footer, and
  admin sidebar rebrand instantly — this is what makes the system deployable to any LGU.
- **Home page banner** (`/admin/settings`) — upload up to 10 banner photos; the homepage hero
  shows them as an auto-rotating, swipeable carousel with dot navigation. With no photos, the
  illustrated highland scene is shown as a fallback.
- **Baggage planning** — booking forms ask "extra baggage?" + approximate KG; the admin
  booking view shows it and the assigned guide's duty SMS includes it (e.g. "Extra baggage
  ~15kg (camping gear)") so guides can plan the trek and transport.
- **Destinations** (`/admin/destinations`) — add/edit with photo upload, activities, difficulty,
  entrance & environmental fees, daily capacity, open hours, guide-required flag, status.
  Uploaded photos immediately replace the illustrated placeholders across the whole site.
- **Tour Guides** (`/admin/guides`) — add/edit profiles, photos, specialties, daily rate,
  max group size, mobile (private, for SMS duty notices), accreditation, status.
- **Packages** (`/admin/packages`) — create packages by picking destinations, set price per pax,
  min/max capacity, inclusions/exclusions, day plan, photo.
- **Settings** (`/admin/settings`) — fee rates (environmental / insurance / reservation %),
  transportation modes & rates (per-pax or per-trip), GCash account (name, number, QR upload),
  and the unpaid-reservation expiry window.

## GCash payment flow (pilot mode — manual verification)
1. Tourist reserves → booking page shows the office **GCash name/number/QR** and the exact amount.
2. Tourist sends money in their GCash app, then submits the **reference number + sender name**.
3. Booking becomes **"Payment under review"**; duplicate reference numbers are rejected.
4. Admin opens the booking (dashboard shows a "payments to verify" alert), matches the reference
   in their GCash app, clicks **Payment received** → payment is recorded against the booking's
   itemized cost breakdown, booking moves to approval, tourist gets an SMS (logged).
5. Cash alternative: the cashier records a Treasurer's Office payment with the **OR number**.

Every transaction is stored in the `Payment` table linked to its booking and fee breakdown, so
collections are fully traceable per booking, per method, per destination — visible in Analytics.

> Compliance note: a personal GCash account is acceptable for pilot testing, but plan to migrate
> to an LGU merchant account (PayMongo or LandBank LinkBiz) so collections flow through the
> Treasurer with official receipts. The migration is a settings/integration change only.

## What's simulated (wire up for production)
- **SMS** — messages are written to the `SmsLog` table (visible in admin) instead of being sent.
  Wire to Semaphore/Movider.
- **Auth** — admin pages are open in this prototype. Add real login + RBAC before deployment.
- **Reservation expiry** — the schema/logic support it (`expiresAt`, capacity release); add a
  cron job to flip expired `pending_payment` bookings to `expired`.
- **Fee amounts** — placeholders. Set the real ordinance amounts in `/admin/settings`.

## Project structure
```
prisma/schema.prisma     # database schema (SQLite dev / Postgres prod)
prisma/seed.ts           # Bagulin seed data (8 destinations, 22 guides, 3 packages)
src/lib/                 # pricing engine, availability/capacity, QR signing, prisma client
src/components/          # header, footer, cards, SVG scenery
src/app/                 # public pages, /build, /booking, /admin, /api routes
docs/                    # design blueprint (01–06) + screenshots
```
