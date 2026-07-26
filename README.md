# Bagulin Smart Tourism Reservation & Tour Guide Management System

**Pilot Site:** Municipality of Bagulin, La Union, Philippines
**Status:** System Design / Blueprint Phase

## The Problem

The Municipal Tourism Office does not know when tourists will visit, and the 22 accredited
community tour guides do not know when to report for duty, because visitor arrivals are
irregular and the destinations are not yet highly popular.

## The Solution

A reservation-first tourism system: **no tourist arrives unannounced, no guide reports
without an assignment.** Every visit starts with an online reservation secured by a
reservation fee / down payment. The tourism office sees every upcoming visit on a calendar,
guides receive SMS duty assignments, and unpaid reservations expire automatically —
eliminating prank bookings.

## Design Documents

| Document | Contents |
|---|---|
| [01 — System Architecture](docs/01-system-architecture.md) | Tech stack, module map, infrastructure, integrations (PayMongo, SMS), multi-tenant design |
| [02 — Database Design](docs/02-database-design.md) | Full ERD, table definitions, SQL DDL, seed data (8 destinations, 22 guides, 4 products) |
| [03 — Workflows & Booking Process](docs/03-workflows.md) | Custom itinerary flow, package booking flow, payment flow, approval workflow, expiry, QR check-in, guide assignment |
| [04 — UI/UX Concept & Dashboard Design](docs/04-ui-ux-dashboard.md) | Page inventory, wireframes, design language, analytics dashboard layout |
| [05 — Admin Modules & Roadmap](docs/05-admin-modules-roadmap.md) | Every admin module, roles & permissions, AI features strategy, phased build plan |

## Core Principles

1. **Reservation-first, pay-to-confirm.** A booking is not confirmed until the reservation
   fee is paid. Unpaid bookings auto-expire (default: 24 hours).
2. **Mandatory guide assignment.** No booking is approved without an assigned accredited
   guide. Guides get SMS duty notices — this directly solves the "when do I report" problem.
3. **Capacity-controlled eco-tourism.** Each destination has a daily visitor capacity the
   system enforces (protects the falls, trails, and cave — and is a strong selling point
   to the Sangguniang Bayan).
4. **Admin-configurable everything.** Destinations, guides, fees, capacities, packages,
   schedules, and content are all managed from the admin panel — no developer needed for
   day-to-day operations.
5. **Multi-tenant from day one.** Bagulin is tenant #1. If the pilot succeeds, onboarding
   another municipality is configuration, not a rewrite.
6. **Accommodations are recommendations only.** Homestays and cottages are listed with
   contact details but are never part of the online payment flow.

## Officially Declared Tourist Destinations (Seed Data)

| Destination | Barangay | Category | Guide Required |
|---|---|---|---|
| Kudlap Burial Cave (National Cultural Treasure) | Cambaly | Heritage / Cave | Yes |
| Kudal People's Park ("Little Baguio") | Tagudtud | Park / Viewpoint | No |
| Tiluniang Falls | Cardiz | Waterfall | Yes |
| Picao Hanging Footbridge (longest in La Union, 211.30 m) | Suyo | Landmark | No |
| Loslosi Falls | Suyo | Waterfall | Yes |
| Bulalakaw Falls (15–20 min trek) | Alibangsay | Waterfall | Yes |
| Kudlap Viewdeck | Cambaly | Viewpoint | No |
| Kapandagan Falls (40 min trek + rappelling) | Cardiz | Adventure / Waterfall | Yes |

**Accredited Community Tour Guides:** 22 (Cardiz 7, Suyo 6, Alibangsay 3, Cambaly 3, Tagudtud 2, Baay 2)

**Local Products showcase:** Quality Softbrooms, Bugnay Wine, Organic Turmeric-Ginger Tea/Powder, Ube Wine
