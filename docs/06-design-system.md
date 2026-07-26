# 06 — Design System (TourRadar-Derived, Bagulin-Branded)

Design elements extracted from tourradar.com (July 2026) and adapted to the Bagulin identity,
plus the icon strategy that keeps the app from looking like a default Bootstrap template.

## 1. What TourRadar Actually Uses (extracted)

### Brand palette
| Role | TourRadar | Hex |
|---|---|---|
| Primary brand | Teal blue ("Matisse") | `#177FA4` |
| Secondary / tints | Pale sky blue ("Spindle") | `#B3D6E9` |
| Text / neutral dark | Charcoal ("Outer Space") | `#323637` |
| Deals / urgency accents | Orange-coral | used **only** for discount badges & key CTAs |
| Background | White / off-white | generous whitespace throughout |

**Key lesson:** TourRadar is *not* orange — it's a calm, trustworthy blue with orange used
sparingly as the "act now" color. Restraint is what makes it look premium.

### Typography
- Clean geometric sans-serif, system-font fallbacks for speed
- Strong weight contrast: bold titles, regular metadata
- Metadata compressed into one line with dot separators: `12 days • 4.8 (177)`

### Signature components
| Component | Pattern |
|---|---|
| **Tour card** | Image top → discount/duration badge overlaid on image → bold 2-line title → one-line meta (`duration • ★rating (reviews)`) → strikethrough original price above bold current price → wishlist heart toggle |
| **Search bar** | White pill/rounded bar over hero; labeled segments ("Where to?", "Traveling when?", "Who is travelling?"); solid CTA button at the end |
| **Trust bar** | Row of proof points: Trustpilot rating, review count, "24/7 support", industry association badges |
| **Badges** | Small rounded pills; bright accent bg for deals ("-45% OFF"), dark translucent for duration over images |
| **Category tiles** | Line-icon + label tiles in a horizontal scroll row (hiking, safari, cruises…) |
| **Sections** | Left-aligned heading + "View all →" link right; 3–4 col card grids; horizontal scroll rows on mobile |
| **Pricing** | "From ₱X" with per-person qualifier; strikethrough anchor price for deals |
| **Ratings** | Star glyph + numeric score + review count in parentheses, always adjacent to title |

### Iconography style
Minimalist **line/stroke icons**, monochrome, consistent grid — never mixed emoji, never
filled clip-art. This consistency is a big part of why it doesn't look "stock."

## 2. Bagulin Adaptation — Token Sheet

We keep TourRadar's *system* (hierarchy, card anatomy, restraint) but keep Bagulin's own
identity (highlands green) so the site is recognizably the LGU's — not a TourRadar clone.

```css
:root {
  /* Brand core (Bagulin identity, TourRadar-style discipline) */
  --brand-900: #0E3D12;   /* deep forest — footers, dark surfaces */
  --brand-700: #1B5E20;   /* PRIMARY — nav active, links, prices, buttons */
  --brand-500: #2E7D32;   /* hover states, gradients */
  --brand-100: #E8F5E9;   /* tint chips, selected states */

  /* Action accent (TourRadar's "orange rule": urgency & CTAs ONLY) */
  --cta-500: #FFB300;     /* Reserve/Search buttons, slots-left badges */
  --cta-700: #E69A00;     /* hover */
  --cta-ink: #3D2C00;     /* text on amber */

  /* Supporting */
  --river-500: #177FA4;   /* borrowed straight from TourRadar — water/info accents, links on dark */
  --river-100: #B3D6E9;   /* info tints, availability calendars */

  /* Neutrals */
  --ink-900: #323637;     /* body text (TourRadar's charcoal) */
  --ink-600: #5C6B60;     /* metadata, captions */
  --line:    #E3E8E1;     /* borders, dividers */
  --bg:      #FAFAF5;     /* page background */
  --card:    #FFFFFF;

  /* Semantic */
  --ok:      #1B7D2C;     /* available, paid */
  --warn:    #B45309;     /* filling up, pending */
  --danger:  #B3261E;     /* full, expired, invalid pass */

  /* Shape & depth */
  --radius-card: 14px;
  --radius-btn:  10px;
  --radius-pill: 999px;
  --shadow-card: 0 4px 18px rgba(20,50,25,.10);
  --shadow-pop:  0 10px 30px rgba(20,50,25,.18);
}
```

### Typography stack
| Use | Font | Fallback |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (Google Fonts, free) | system-ui |
| Body / UI | **Inter** | Segoe UI, system-ui |
| Numbers in prices/analytics | Inter tabular-nums | — |

Bricolage Grotesque is characterful without being cute — instantly kills the "Bootstrap
default" look, which mostly comes from Helvetica/system type + gray-blue buttons.

## 3. Icon Library Decision

Researched options (all MIT/free, production-ready):

| Library | Icons | Style | Verdict |
|---|---|---|---|
| **Phosphor** ✅ | 1,500+ designs × **6 weights** (thin/light/regular/bold/**fill**/**duotone**) ≈ 9,000 variants | Flexible family | **CHOSEN** — duotone weight gives a distinctive, custom feel nobody associates with templates; fill weight for active states; huge travel/outdoor coverage (mountains, waves, tent, footprints, ticket, qr-code) |
| Lucide | ~1,600 | Clean stroke | Excellent, but it's the new default of every AI starter kit — exactly the "stock look" we're avoiding |
| Tabler | 5,900+ | Stroke, 24px grid | Great coverage; visually close to Lucide |
| Heroicons | ~300 | Outline/solid | Too small a set; also very "template" |

**Usage pattern that creates the distinctive look:**
- **Duotone** (`ph-duotone`) in brand green for feature/section icons — the two-tone effect reads as custom illustration
- **Regular stroke** (`ph`) for utility icons (nav, meta, close, chevrons)
- **Fill** (`ph-fill`) for active/selected states (filled heart on wishlisted, filled star in ratings)
- One accent color per icon, never rainbow

**Install:**
```html
<!-- Prototype / plain HTML -->
<script src="https://unpkg.com/@phosphor-icons/web"></script>
<i class="ph-duotone ph-mountains"></i>
```
```bash
# Production (Next.js) — tree-shaken, only used icons ship
npm i @phosphor-icons/react
```
```tsx
import { Mountains, Waves, Ticket, QrCode } from "@phosphor-icons/react";
<Mountains size={28} weight="duotone" color="var(--brand-700)" />
```

### Icon map (consistency contract)
| Concept | Phosphor icon | Weight |
|---|---|---|
| Brand / logo mark | `mountains` | duotone |
| Waterfalls category | `waves` | duotone |
| Heritage / cave | `bank` or `scroll` | duotone |
| Viewpoint | `binoculars` | duotone |
| Adventure / rappel | `person-simple-hike` | duotone |
| Park | `tree` | duotone |
| Location / barangay | `map-pin` | regular |
| Date / calendar | `calendar-blank` | regular |
| Travelers / pax | `users` | regular |
| Guide | `user-circle-check` | duotone |
| Guide required badge | `person-simple-hike` | fill (small) |
| Price / fees | `receipt` | duotone |
| Reservation fee | `hand-coins` | duotone |
| Payment GCash/Maya | `device-mobile` + `qr-code` | regular |
| QR tourist pass | `qr-code` | duotone |
| SMS notification | `chat-circle-text` | duotone |
| Rating star | `star` | fill (amber) |
| Wishlist | `heart` | regular → fill on toggle |
| Capacity | `gauge` | duotone |
| Approved / valid | `seal-check` | fill (green) |
| Expired / invalid | `seal-warning` | fill (red) |
| Local products | `basket` | duotone |
| Homestay (recommendation) | `house-line` | duotone |
| Transport | `motorcycle` / `van` | duotone |
| Analytics | `chart-line-up` | duotone |
| Search | `magnifying-glass` | bold |

## 4. Component Specs (TourRadar anatomy, Bagulin skin)

**Package/tour card** — image (16:10, radius top only) → duration badge (dark translucent
pill, top-left) + slots-left badge (amber pill, top-right) + heart (top-right corner circle
button) → title (Bricolage, 17px, max 2 lines) → meta line `Full day • ★ 4.8 (46)` →
inclusion chips (green-100 pills) → dashed divider → price block ("From" caption + bold
green price + "/ person") + green Book button.

**Search bar** — white rounded-16 bar, three labeled segments (`DESTINATION / VISIT DATE /
TRAVELERS` in 11px brand-green uppercase over 15px values), amber Search segment with
`magnifying-glass` bold icon.

**Status stepper (My Booking)** — `Reserved → Paid → Approved → Enjoy!` with `seal-check`
fills for done, `circle-dashed` for pending — same mental model as TourRadar's booking steps.

**Buttons** — primary: amber, radius 10, bold, `--cta-ink` text (reserve/pay actions only);
secondary: solid brand green (navigational commits like "Book now"); tertiary: 1.5px green
outline on white. Never gray — gray buttons are the #1 "Bootstrap default" tell.

**Badges** — pills only (radius 999): amber = scarcity/action, dark-translucent = factual
overlay on images, green-100 = inclusions/features, `--river-100` = informational.

**Do-not list (keeps us un-stock):** no default blue `#0d6efd`, no gray `btn-secondary`,
no mixed emoji-as-icons in production UI, no more than 2 accent colors per screen, no
centered long paragraphs, no stock photos — real Bagulin photography only.
