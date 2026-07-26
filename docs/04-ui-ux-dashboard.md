# 04 — UI/UX Concept & Dashboard Design

## 1. Design Language

| Element | Choice | Rationale |
|---|---|---|
| Mood | "Highlands of La Union" — cool, green, adventurous | Matches pine breezes, falls, and mountain views |
| Primary color | Forest green `#1B5E20` | Eco-tourism identity; per-municipality themeable |
| Accent | Warm amber `#FFB300` | CTAs ("Reserve Now"), availability highlights |
| Supporting | River blue `#0277BD`, off-white `#FAFAF5`, earth brown | Falls/river imagery, warmth |
| Typography | Headings: a rounded display font (e.g. Bricolage Grotesque); body: Inter | Friendly but professional |
| Imagery | Full-bleed photos of the actual sites; real guide photos | Authenticity is the product — no stock photos |
| Layout | **Mobile-first**, thumb-reachable CTAs, cards | Most tourists will book from a phone on mobile data |
| Language | English primary; Filipino/Ilocano labels where it helps | Local + domestic tourists |
| Accessibility | 4.5:1 contrast, large tap targets, works on 3G | Rural connectivity reality |

## 2. Public Site — Page Inventory

1. **Home** — hero (Kudlap Viewdeck panorama), "Plan Your Visit" (2 big buttons: *Build My Itinerary* / *Browse Packages*), featured destinations carousel, local products strip, "Meet Our Guides", travel advisory banner (admin-controlled).
2. **Destinations index** — filterable cards (category, barangay, difficulty, activity).
3. **Destination profile** — gallery, description, activities chips, difficulty + trek time, guide-required badge, fees table, what to bring, safety notes, map pin, live availability calendar, "Add to Itinerary" button, reviews.
4. **Itinerary Builder** — see wireframe below.
5. **Packages index + Package detail** — pricing, inclusions/exclusions, day-by-day plan, availability calendar, capacity indicator ("6 of 20 slots left on Mar 15").
6. **Guides index + Guide profile** — photo, barangay, experience, specialties, certifications, star rating + reviews, availability calendar (busy/free only — no personal details).
7. **Local Products** — showcase with producer stories and where-to-buy.
8. **Stay (Accommodations)** — recommendation cards with contact numbers; clear label: *"Contact hosts directly — not bookable online."*
9. **My Booking** — lookup by booking code + OTP: status tracker (stepper: Reserved → Paid → Approved → Enjoy!), cost breakdown, QR pass download, cancel request.
10. **Visitor info** — how to get to Bagulin, weather advisory, contact.

## 3. Key Wireframes

### Itinerary Builder (mobile)

```
┌─────────────────────────────┐
│ ◀ Build Your Itinerary      │
│─────────────────────────────│
│ 📅 Visit date  [Mar 15 ▾]   │
│ 👥 Adults [2]  Children [1] │
│─────────────────────────────│
│ YOUR ITINERARY (drag ↕)     │
│ ① Kudlap Viewdeck        ✕ │
│ ② Bulalakaw Falls  🥾15m  ✕ │
│    ⚠ guide required         │
│ ＋ Add destination           │
│─────────────────────────────│
│ 🚌 Transport? ( ) None      │
│    (•) Habal-habal ₱50/pax  │
│─────────────────────────────│
│ COST BREAKDOWN              │
│ Entrance (2 sites × 3 pax)  │
│                       ₱180  │
│ Environmental ₱30 × 3  ₱90  │
│ Tour guide (1 × ₱600) ₱600  │
│ Transport ₱50 × 3     ₱150  │
│ Insurance ₱25 × 3      ₱75  │
│ ─────────────────────────── │
│ TOTAL              ₱1,095   │
│ Reserve now (20%)    ₱219   │
│ Balance on arrival   ₱876   │
│─────────────────────────────│
│ [   Reserve My Itinerary  ] │
└─────────────────────────────┘
```

The breakdown recalculates live as destinations/pax change — full transparency **before**
any personal details are asked.

### Booking Status Tracker (My Booking)

```
● Reserved ─ ● Paid ─ ● Approved ─ ○ Enjoy!
Booking BGL-8F3K2A · Mar 15 · 3 pax
Your guide: Danilo Pulmano (Alibangsay) ★4.8
[ View QR Pass ]  [ Cost breakdown ▾ ]
Balance on arrival: ₱876
```

## 4. Admin Dashboard (Tourism Office Home Screen)

```
┌────────────────────────────────────────────────────────────┐
│ TODAY — Thu, Mar 12          🔔 3 pending approvals        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ Arrivals│ │ Pending │ │ Revenue │ │ Guides  │            │
│ │ today   │ │ approv. │ │ MTD     │ │ on duty │            │
│ │   24    │ │    3    │ │ ₱48,250 │ │  5 / 22 │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│────────────────────────────────────────────────────────────│
│ APPROVAL QUEUE                    │ TODAY'S DUTY ROSTER    │
│ BGL-8F3K2A · Mar 15 · 3 pax  [→]  │ D. Pulmano → Bulalakaw │
│ BGL-2M9QRT · Mar 16 · 12 pax [→]  │ J. Tuaban → Kapandagan │
│ BGL-7Q1ZKP · Mar 18 · 5 pax  [→]  │ V. Dangpilen → Loslosi │
│────────────────────────────────────────────────────────────│
│ CAPACITY HEATMAP (next 14 days)                            │
│            12 13 14 15 16 17 18 19 20 ...                  │
│ Bulalakaw  ▓▓ ░░ ▓▓ ██ ░░ ░░ ▓▓ ...   ░ open ▓ filling █ full│
│ Kapandagan ░░ ░░ ▓▓ ▓▓ ██ ░░ ░░ ...                        │
│ Tiluniang  ░░ ░░ ░░ ▓▓ ░░ ░░ ░░ ...                        │
│────────────────────────────────────────────────────────────│
│ 📈 Visitor trend (90d)      │ 🔮 Forecast: Holy Week +180% │
│    line chart               │    expected — pre-schedule    │
│                             │    12 guides Apr 2–5          │
└────────────────────────────────────────────────────────────┘
```

### Analytics & Forecasting Page

- **Visitor statistics:** arrivals by day/week/month; by destination; by origin (feeds DOT/provincial arrival reports — one-click export); domestic vs foreign; group size distribution; repeat-visitor rate.
- **Revenue analytics:** collections by fee type (environmental / entrance / guide / transport / insurance), by payment method, by destination and package; online vs treasurer collections; reservation-fee forfeitures.
- **Booking funnel:** started → priced → submitted → paid → approved → completed; expiry/cancellation rates (tells you if the reservation fee is set too high).
- **Guide analytics:** duties per guide (fair-rotation check), ratings, earnings, response time to duty confirmations.
- **Forecasting panel:** predicted arrivals per week with confidence band; detected peak seasons (Holy Week, summer, long weekends, town fiesta); staffing suggestion ("expect ~60 visitors Sat — schedule 6 guides").
- **Capacity alerts:** destinations trending toward full; suggest opening more slots or promoting alternatives.

### Booking Calendar (Operations View)

Month/week grid; each day shows total pax, per-destination load, and assigned guides.
Click a day → all bookings that day → click through to booking detail (itinerary, payments,
QR status, SMS history, status log).

## 5. Guide Portal (simple mobile web, per-guide login)

- **My duties:** upcoming assignments (date, site, pax, lead tourist mobile, meetup point) with Confirm / Decline buttons.
- **My calendar:** mark unavailable dates (farm work, personal).
- **My profile:** photo, bio, certifications (admin-verified).
- **My earnings:** completed duties × rate, monthly totals.
- Everything also mirrored over SMS for guides with basic phones — the portal is an enhancement, never a requirement.

## 6. UX Rules That Matter Here

1. **Price before personal data.** Never ask for a name before showing the full cost breakdown.
2. **Three taps to a priced itinerary.** Date → destinations → pax = price.
3. **The QR pass must work offline** — downloadable image, since mountain sites lack signal.
4. **Show scarcity honestly** — "8 slots left" drives commitment and respects real eco-capacity.
5. **Every status change = an SMS.** The tourist should never wonder what's happening; neither should the guide.
6. **Admin actions are two clicks max** for the daily loop (approve → assign guide → done).
