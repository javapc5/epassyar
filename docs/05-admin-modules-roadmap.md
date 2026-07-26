# 05 — Administration Modules, AI Strategy & Roadmap

## 1. Roles & Permissions

| Capability | SUPER_ADMIN | TOURISM_ADMIN | STAFF | GUIDE |
|---|:-:|:-:|:-:|:-:|
| Manage municipalities (tenants) | ✅ | — | — | — |
| Manage employees/users | ✅ | ✅ | — | — |
| Manage destinations, capacities, fees | ✅ | ✅ | — | — |
| Manage tour guides + accreditation | ✅ | ✅ | — | — |
| Manage packages | ✅ | ✅ | — | — |
| Approve/reject bookings, assign guides | ✅ | ✅ | — | — |
| Record treasurer payments, QR check-in | ✅ | ✅ | ✅ | — |
| View analytics dashboard | ✅ | ✅ | ✅ (limited) | — |
| Confirm own duties, set own availability | — | — | — | ✅ |
| Site content, advisories, products, accommodations | ✅ | ✅ | — | — |

Only administrators can manage destinations, guides, employees, schedules, capacities, and
fees — enforced at the API layer (not just hidden buttons), with every change audit-logged.

## 2. Admin Module Breakdown

1. **Destination Management** — CRUD, gallery upload, fees (entrance + environmental override), daily capacity, open/close times, blackout dates (typhoon/maintenance), status toggle, map coordinates.
2. **Tour Guide Management** — roster CRUD, photos, certifications with expiry alerts, specialties, daily rate, max group size, suspend/activate, availability override, duty history, ratings view.
3. **Package Management** — package builder (pick destinations in order, set inclusions/exclusions, price per pax, min/max pax, images, day-by-day notes), duplicate-as-template, activate/deactivate seasonally.
4. **Booking Management** — approval queue, booking detail (itinerary, breakdown, payments, SMS log, status history), calendar view, manual booking entry (walk-in/phone bookings get the same record!), cancel/refund handling, no-show flagging.
5. **Payments & Fees** — fee settings (environmental, insurance, reservation %), transport routes/rates, treasurer payment entry with OR number, PayMongo reconciliation view, daily collection report (matches treasurer's cashbook).
6. **Employee/User Management** — accounts, roles, password resets, deactivation.
7. **Capacity Monitoring** — 14-day heatmap, alerts at 80% full, per-destination utilization trends.
8. **Notification Center** — SMS templates (editable), delivery log, resend failed, credit balance monitor.
9. **Content & Settings** — homepage hero/announcements, travel advisories, local products, accommodations directory, municipality branding, expiry-hours setting.
10. **Reports & Analytics** — dashboards (see doc 04) + one-click exports: DOT/provincial tourist-arrival report, monthly revenue by fee type, guide honoraria summary, visitor origin report. **This module is the endorsement weapon for other municipalities.**

## 3. AI / Smart Features — Honest Strategy

> **The honest truth:** real machine-learning forecasting needs 1–2 years of your own
> booking history. Bagulin starts with zero rows. So we phase intelligence in — each phase
> genuinely useful, none of it fake.

### Phase A (launch) — Rules + heuristics that feel smart and work day one
- **Smart guide assignment:** availability → barangay proximity → specialty → fair rotation → rating (doc 02 §5).
- **Itinerary recommendations (content-based):** "You added Bulalakaw Falls → tourists also pair Kudlap Viewdeck (same area, easy add-on)." Rules from geography (same/adjacent barangay), category variety (falls + viewpoint + heritage), difficulty compatibility, and time budget (sum trek durations vs day length).
- **Smart package suggestion:** if a custom itinerary closely matches an official package, show "Package X covers this for ₱Y — save ₱Z" (converts customs into easier-to-operate packages).
- **Calendar-aware peak flags:** preloaded PH holiday calendar (Holy Week, long weekends, summer, town fiesta) drives "expect high demand" banners and staffing prompts — no ML needed.

### Phase B (after ~6 months of data) — Statistical forecasting
- Weekly arrivals forecast via seasonal decomposition / moving averages with day-of-week + holiday effects (simple, explainable, works with small data).
- Booking-lead-time model → "bookings for Holy Week usually start N weeks ahead; open guide scheduling now."
- Popularity ranking + conversion analytics per destination/package.

### Phase C (year 2+, and with multiple municipalities) — Real ML
- Gradient-boosted / Prophet-style arrival forecasting with weather, school calendar, and cross-municipality signals.
- Collaborative-filtering recommendations once visitor volume supports it.
- Dynamic capacity suggestions and no-show prediction.

An LLM-powered trip-planning chat assistant ("3 of us, ₱1,500 budget, we like swimming —
plan our day") is a great Phase B/C add-on via the Claude API — cheap to add because the
itinerary builder and pricing engine already exist as APIs it can call.

## 4. Build Roadmap

| Phase | Scope | Duration (est.) |
|---|---|---|
| **0 — Foundation** | Repo, Next.js + Prisma + Postgres schema, auth/RBAC, multi-tenant core, seed Bagulin data | 1 wk |
| **1 — Content** | Destination/guide/package/product/accommodation CMS + public pages | 2 wks |
| **2 — Booking engine** | Itinerary builder, pricing engine, capacity service, package booking, OTP, expiry jobs | 2–3 wks |
| **3 — Payments & passes** | PayMongo + webhook, treasurer entry, QR passes, scanner page, SMS integration | 2 wks |
| **4 — Operations** | Approval queue, guide assignment + portal, booking calendar, notifications | 2 wks |
| **5 — Analytics** | Dashboard, reports, exports, Phase-A smart features | 1–2 wks |
| **6 — Pilot launch** | UAT with Tourism Office, encode real fees (per ordinance), staff + guide training, soft launch | 2 wks |

~3 months part-time to a credible pilot. Run the manual logbook in parallel for the first
month to build staff trust, then retire it.

## 5. Pilot Success Metrics (define BEFORE launch — this is your endorsement package)

1. % of visits booked online vs walk-in
2. Prank/no-show rate (expect near-zero, thanks to the reservation fee — measure it!)
3. Guide utilization + fairness spread across the 22 guides
4. Time to produce the monthly DOT arrival report (hours → one click)
5. Revenue collected + fully traceable vs prior manual months
6. Tourist satisfaction (post-visit rating average)
7. Booking lead time (proves the office now knows arrivals in advance — the original problem, solved and measurable)

Present these numbers to the province after 3–6 months → endorsement to other municipalities
becomes a data-backed proposal, and each new LGU is one `municipalities` row + their content.

## 6. Practical Cautions (read before development)

- **Fee amounts must match municipal ordinance.** Get the official fee schedule (and the SB resolution for online collection) before building the pricing config UI around wrong assumptions.
- **Treasurer buy-in early.** The PayMongo merchant account needs LGU registration; the reserve-online-pay-at-office mode is the fallback that lets you launch even if that paperwork is slow.
- **Guide data privacy:** publish only professional info (name, photo, barangay, certifications, rating). Mobile numbers stay internal. Comply with the Data Privacy Act — add a short privacy notice + consent checkbox at booking.
- **SMS budget:** ~5–7 SMS per booking lifecycle ≈ ₱3–4/booking. Trivial, but put it in the tourism office's supplies budget line so it never lapses.
- **Photos are the product.** Before launch, commission one good photo day at all 8 sites (drone shots of Picao bridge and the falls). This matters more to conversion than any feature.
