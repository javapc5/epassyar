# 03 — Workflows & Booking Process

## 1. Booking Lifecycle (State Machine)

```mermaid
stateDiagram-v2
    [*] --> pending_payment : Tourist submits booking\n(OTP-verified mobile)
    pending_payment --> pending_approval : Reservation fee PAID\n(PayMongo webhook / cashier entry)
    pending_payment --> expired : expires_at reached\n(auto job, slot released)
    pending_approval --> approved : Admin reviews + assigns guide\nQR pass issued, SMS sent
    pending_approval --> cancelled : Admin rejects\n(refund per policy)
    approved --> checked_in : QR scanned on arrival\nbalance collected (OR issued)
    approved --> cancelled : Tourist/admin cancels
    checked_in --> completed : Visit ends\nreview SMS link sent
    completed --> [*]
    expired --> [*]
    cancelled --> [*]
```

**Anti-prank design:** a booking holds capacity only while `pending_payment` (max = expiry
window, default 24 h) and is never visible to guides or counted as a real arrival until the
reservation fee is actually paid. OTP verification of the mobile number blocks bulk fake
submissions before that.

## 2. Method 1 — Custom Itinerary Builder

```mermaid
flowchart TD
    A[Browse destinations] --> B[Add destinations to itinerary<br/>drag to reorder, per-day for multi-day trips]
    B --> C[Select visit date + number of pax<br/>adults / children]
    C --> D{Capacity check<br/>every destination, every date}
    D -- full --> D2[Show alternative dates<br/>+ AI-suggested similar itinerary] --> C
    D -- ok --> E[Optional: transport add-on<br/>choose route/vehicle]
    E --> F[PRICING ENGINE - server side]
    F --> G[Complete cost breakdown displayed:<br/>Entrance fees per destination<br/>Environmental fee x pax<br/>Guide fee - auto: guides needed x days x rate<br/>Transport fee<br/>Insurance x pax<br/>= TOTAL<br/>Reservation fee due now<br/>Remaining balance on arrival]
    G --> H[Tourist details + OTP verify mobile]
    H --> I[Submit → status: pending_payment<br/>expires_at = now + 24h]
    I --> J[Pay reservation fee<br/>GCash / Maya / Card via PayMongo]
    J --> K[status: pending_approval<br/>SMS: 'Reservation received, awaiting approval']
```

**Pricing engine rules (all server-side):**

| Fee | Calculation |
|---|---|
| Entrance | Σ per destination: `entrance_fee × pax` |
| Environmental | `env_fee × pax` (destination override, else municipal default) |
| Guide | `ceil(pax / max_group_size) × daily_rate × duration_days` — only if any destination has `guide_required = TRUE` (guide is still mandatorily *assigned* for all bookings; fee applies when guiding service is required) |
| Transport | route `fee_per_pax × pax` or `fee_per_trip × trips needed` |
| Insurance | `insurance_fee × pax × duration_days` |
| **Total** | sum of the above |
| Reservation fee | `percent_of_total` (e.g. 20%) or fixed amount — per fee_settings |
| Remaining balance | `total − amount_paid`, collected at check-in with official receipt |

Every line is stored in `booking_fees`, so the tourist's breakdown, the admin's view, and
the treasurer's report always agree.

## 3. Method 2 — Official Tour Package Booking

```mermaid
flowchart TD
    A[Browse packages<br/>images, duration, inclusions, price] --> B[Package detail page:<br/>destinations, day-by-day itinerary,<br/>inclusions/exclusions, reviews]
    B --> C[Pick date on availability calendar<br/>green = open, orange = few slots left, red = full]
    C --> D[Enter pax → price = price_per_pax x pax<br/>+ any non-included fees shown transparently]
    D --> E[Tourist details + OTP verify]
    E --> F[Submit → pending_payment → pay reservation fee]
    F --> G[pending_approval → same approval flow as custom]
```

## 4. Payment Flow

```mermaid
sequenceDiagram
    participant T as Tourist
    participant S as System
    participant PM as PayMongo
    participant TR as Treasurer/Cashier
    participant SMS as SMS Gateway

    T->>S: Submit booking
    S->>S: Compute totals server-side, create booking (pending_payment, expires_at +24h)
    S->>SMS: "Booking BGL-8F3K2A created. Pay ₱480 reservation fee within 24h: <link>"
    alt Online payment (GCash / Maya / Card)
        T->>PM: Pay via checkout link
        PM-->>S: Webhook: payment.paid (verified signature)
        S->>S: payments row = paid, booking → pending_approval
    else Pay at Treasurer's Office
        T->>TR: Pay in person
        TR->>S: Record payment + OR number in admin panel
        S->>S: booking → pending_approval
    end
    S->>SMS: Tourist: "Payment received. Awaiting tourism office approval."
    Note over S: — after admin approval —
    S->>SMS: Tourist: "APPROVED! Your QR tourist pass: <link>. Balance ₱1,920 payable on arrival."
    S->>SMS: Guide: "DUTY: Mar 15, Bulalakaw Falls, 6 pax, lead: Juan D. Reply YES to confirm."
    Note over T,TR: — on arrival —
    T->>TR: Show QR pass at tourism desk
    TR->>S: Scan QR → validate token → collect balance → OR issued
    S->>S: booking → checked_in, payment (balance, treasurer_cash) recorded
```

**Reminder schedule (background jobs):**
- T+12h unpaid → SMS warning "12 hours left to pay"
- `expires_at` reached → booking `expired`, capacity released, SMS notice
- Visit-date −2 days → SMS reminder to tourist (what to bring, meetup point) and duty reminder to guide
- Visit-date +1 day, status completed → SMS with review link

## 5. Booking Approval Workflow (Admin)

```mermaid
flowchart TD
    A[Approval queue shows bookings in pending_approval] --> B[Admin opens booking:<br/>itinerary, pax, payment proof, tourist info]
    B --> C{Review}
    C -- issue --> R[Reject with reason → SMS + refund per policy]
    C -- ok --> D[Assign guide - MANDATORY<br/>system pre-ranks: available → barangay match →<br/>specialty → fair rotation → rating]
    D --> E{Guide count OK?<br/>1 guide per max_group_size pax}
    E -- need more --> D
    E -- yes --> F[Approve]
    F --> G[QR pass generated - signed token]
    G --> H[SMS to tourist: approved + pass link + balance]
    H --> I[SMS to guide/s: duty assignment]
    I --> J[Booking appears on office calendar + guide duty roster]
```

## 6. Day-of-Visit: QR Check-in

1. Tourist arrives at the Tourism Office desk (or destination entry point) and shows the QR pass (screenshot works — no signal needed).
2. Staff scans with any phone via the admin scanner page → system validates the signed token, shows booking summary + **remaining balance due**.
3. Cashier collects balance, enters OR number → booking `checked_in`.
4. Assigned guide meets the group (guide confirmed duty via SMS reply / guide portal).
5. After the tour, guide or staff marks `completed` → visitor counted in analytics → review SMS sent.

**Edge cases handled:** re-scan of a used pass shows "already checked in"; scan of an
expired/cancelled booking shows red "INVALID" with reason; no-shows auto-flagged if not
checked in by close time (reservation fee forfeited per policy — configurable).

## 7. Guide Duty Cycle (Solves the Core Problem)

```mermaid
flowchart LR
    A[Guide marks unavailable dates<br/>in guide portal - optional] --> B[System assigns duty<br/>on booking approval]
    B --> C[SMS duty notice<br/>date, site, pax, meetup]
    C --> D[Guide confirms<br/>SMS reply or portal tap]
    D --> E[Duty appears in guide's<br/>personal calendar]
    E --> F[Day-of: guide reports,<br/>leads tour]
    F --> G[Marks tour completed<br/>→ counted toward earnings report]
```

Guides only ever travel to a site when there is a **paid, approved booking** — no more
reporting for duty on days nobody comes, and no tourists arriving with no guide present.
The admin dashboard shows a **duty roster per day**; each guide's portal shows earnings
history (assignments × daily rate) — useful for their own records and LGU honoraria processing.
