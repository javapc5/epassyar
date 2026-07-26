# QA Report — Bagulin Smart Tourism System

**Date:** 2026-07-05 · **Focus:** tourist mobile booking experience (375 px) · **Build:** Next.js 15 production

## Summary

The system is **stable and production-buildable**. A full production build passes with **zero
errors** (clean TypeScript, all 12 static pages generated, healthy bundles ~106–120 kB first
load). A complete tourist booking journey was simulated on a 375 px mobile viewport — from
browsing to reserving to paying via GCash — and **works end to end with no horizontal overflow
on any tourist page and no runtime errors**. During the simulation the real GCash QR uploaded
through Settings displayed correctly and at a scannable size on the payment page.

The findings below are **minor polish items**, not blockers. The tourist-facing ones have
already been fixed (see "Fixed in this pass").

---

## Test coverage

| Area | Result |
|---|---|
| Production build (`next build`) | ✅ Pass, 0 errors |
| Home, Destinations, Packages, Guides, Build, Stay, Products, My Booking @ 375px | ✅ 200, 0 overflow |
| Destination detail / Package detail / Guide profile @ 375px | ✅ 0 overflow |
| Full booking: select → live quote → baggage → reserve → GCash pay → "under review" | ✅ Works |
| GCash QR upload → shown scannable on payment page | ✅ Verified live |
| Browser console | ✅ Only benign Next.js sticky-header auto-scroll warnings |
| Server logs | ✅ No errors |

---

## Fixed in this pass (tourist mobile priority)

1. **Undersized tap targets (Medium).** The adults/children/pax +/− stepper buttons were 36 px
   tall — below the 44 px mobile touch-target guideline. **Fixed:** bumped to 44 px on both the
   itinerary builder and package booking, added ARIA labels.
2. **"Add to itinerary" lost intent (Low→Medium for UX).** From a destination page the button
   opened an empty builder. **Fixed:** it now passes `/build?add=<id>` and the builder
   pre-selects that destination and shows the quote immediately.
3. **Date off-by-one in some timezones (Low).** The default visit date was computed from a UTC
   string. **Fixed:** now computed from local time; min-date guard unchanged.
4. **Awkward text wrap in GCash "prefer cash" note (Cosmetic).** The inline booking code caused
   a ragged wrap. **Fixed:** wrapped in a span with relaxed leading and a non-breaking code.

---

## Remaining suggestions (not yet applied — your call)

### Tourist experience
- **[Medium] Inline field validation.** Mobile number accepts any text; add a `09XXXXXXXXX`
  pattern check and highlight empty required fields before submit, rather than one error line.
- **[Medium] Sticky "Reserve" bar on mobile.** On a long builder page the reserve button sits
  far below. A slim sticky bottom bar showing the running total + Reserve would lift conversion.
- **[Low] Gallery lightbox.** Gallery thumbnails currently display inline; tapping to open a
  full-screen swipeable viewer is expected on mobile.
- **[Low] Empty-state copy.** When a date is fully booked, show suggested alternative dates
  inline (the capacity data is already computed).

### Trust & clarity
- **[Medium] GCash amount copy button.** The number is tap-to-copy; add the same for the exact
  peso amount to reduce mis-payments.
- **[Low] Show assigned guide photo on the approved booking / QR pass** once galleries are
  populated (data is already linked).

### Operational (admin) — lower priority for the pilot
- **[High for launch] Admin authentication.** Admin routes are open. Add login + role-based
  access before real deployment.
- **[High for launch] Reservation-expiry job.** Schema supports it; add a cron to flip expired
  unpaid bookings to `expired` and release capacity.
- **[Medium] Real SMS sending.** Messages are logged to the `SmsLog` table; wire Semaphore.
- **[Low] Mobile admin nav.** The admin sidebar is hidden on phones; add a hamburger if staff
  will approve bookings from a phone.

---

## Notes
- The one build failure seen mid-session was a false alarm: running `next build` while the dev
  server held the `.next` cache. A clean build (server stopped) passes with 0 errors.
- Console "Skipping auto-scroll due to position: sticky" warnings come from Next's router and
  the sticky header; they are harmless and do not affect users.
