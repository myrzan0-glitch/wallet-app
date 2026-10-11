# Plan: Paid events with Wallet tickets (B2B, Uzbekistan first)

*Status: planning. Last updated 2026-10-11.*

## 1. Why events, not cafe loyalty

Cafes that care about loyalty tend to build their own app or join a chain's app, so a shared loyalty card is a hard sell.
Paid community events have a sharper, unsolved problem.

The case that started this: **English speaking clubs** in Tashkent.

| Today | Pain |
|---|---|
| Fee around 100,000 so'm, limited spots | Spots are tracked by hand in a Telegram chat or a spreadsheet |
| To join, you message the admin, then pay by Click/Payme transfer | Often a plain card-to-card transfer, with no receipt, ticket or proof tied to the person |
| At the door, the admin checks people one by one | Attendees show a Telegram message or a transfer screenshot; slow and easy to fake |

**Product:** a Luma-like service for Uzbekistan.

- The organizer creates an event with a fee and a capacity, and gets a landing page to share.
- Attendees register and pay, and get a ticket in **Apple/Google Wallet**.
- At the door, the organizer **scans tickets with their phone**.
- The organizer keeps a history of past events and attendees.

This reuses what is already built: pass signing for both wallets, the camera barcode scanner, the PassKit web service (it can now push ticket updates), uz/ru/kk/en, and the stats store.

## 2. Users and core flows

### Organizer (club admin)

1. **Signs in with Telegram.** Admins already live there, and it needs no SMS costs.
2. **Sets up a profile page** at `/o/<slug>`: name, logo, description, links.
3. **Creates an event:**
   - title, cover, date and time, venue (address plus map link), description
   - capacity, price (0 = free), how to pay (see §4)
   - questions for registrants: name, phone or Telegram, and optional custom fields
4. **Shares the event link.** It gets a proper preview card in Telegram and Instagram.
5. **Handles registrations** in a dashboard or in the Telegram bot:
   - new registration → *awaiting payment* → *proof sent* → **Approve / Reject** (one tap; inline buttons in Telegram)
   - spots are held for N minutes while someone pays, then released
   - a waitlist moves people up automatically when a spot frees
6. **Checks people in at the door.** The organizer opens the scanner on their phone, points it at the ticket and sees a green "✓ Aziza K., 1st visit" or a red "already checked in / not paid / wrong event".
7. **Afterwards:** history of events, attendance, no-shows, revenue, and repeat attendees (the seed of loyalty).

### Attendee

1. Opens the event page, presses **Register** and enters name and phone or Telegram.
2. Pays (§4) and, for manual payment, uploads the receipt screenshot.
3. Once confirmed, gets the ticket by:
   - **Add to Apple Wallet / Google Wallet**
   - a ticket page link
   - a Telegram message from the bot
4. The Wallet ticket appears on the lock screen near the event time and place. If the organizer changes the time or venue, the pass updates itself (PassKit push or Google object update).

## 3. MVP scope

| In | Later |
|---|---|
| Organizer profile and event pages | Recurring events / series, season passes |
| One ticket type per event (free or fixed price) | Several ticket types, promo codes |
| Registration with capacity, holds and waitlist | Seat maps |
| Payment: manual proof + organizer approval (§4, stage 0) | Automatic payment (§4, stages 1–2) |
| Wallet ticket (Apple + Google) with a signed QR | Apple Wallet "poster" event tickets, NFC |
| Phone scanner check-in, works with poor internet | Multiple door staff accounts with roles |
| Telegram bot: notify organizer, approve/reject, send ticket | Reminders, broadcast to attendees |
| Event history and basic stats per organizer | Membership/loyalty ("10th visit free") |
| uz / ru / kk / en | Custom domains for organizers |

## 4. Payments: the hard part

There are two separate problems:

- **(a) Taking the payment** and knowing for sure that it happened.
- **(b) Getting the money to the organizer**, minus our fee.

Problem (b) is regulated. Holding other people's money and paying it out is a payment service, which needs a **Central Bank of Uzbekistan licence**: payment organizations are licensed under CBU resolution No. 3431 of 05.05.2023, and the CBU does revoke licences.
So **we never put attendee money through our own card or account.** The plan moves through three stages:

### Stage 0: no money touches us (launch with this)

Each organizer keeps getting paid the way they are paid today:

- their own **Payme/Click payment link** or card number; or
- for organizers who have one, their own Payme Business / Click merchant account.

What we add is the part that is missing today:

- **The order:** each registration gets an amount, a reference code (e.g. `ESC-0412`) and a payment deadline that holds the spot.
- **Proof:** the attendee uploads the receipt screenshot. We show it to the organizer next to the expected amount and reference.
- **One-tap approval** in the dashboard or the Telegram bot. Approval issues the Wallet ticket.
- **An audit trail:** who paid, when, what was approved, who checked in.

Good enough to launch with because:

- no licence, no merchant contracts, no payout liability;
- it works for individuals, sole proprietors (ИП) and companies alike;
- it already fixes the door-check problem completely.

**Our revenue at this stage:** free during the pilot, then a flat monthly plan per organizer, or a per-ticket fee invoiced monthly. Payment for these is outside the attendee flow.

### Stage 1: organizer's own merchant account, automatic confirmation

Organizers who are ИП/ООО (or self-employed, on Click) connect **their own** merchant credentials:

- **Payme Business:** cashboxes are only for legal entities and ИП (ИП, ЧП, ООО, АО…). Integration is the Merchant API: Payme calls our endpoint with `CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction` and the rest, using HTTP Basic auth with the cashbox key.
- **Click:** self-employed people (with a Soliq certificate), ИП and companies can accept payments. Integration is the SHOP API: `Prepare` / `Complete` callbacks, MD5 signature, keys from merchant.click.uz.

The flow:

- We host one callback endpoint per organizer and store their keys encrypted.
- Money goes **straight to the organizer's account**. Payment confirmation is automatic, so there is no screenshot step and the ticket is issued instantly.
- **To check:** fiscal receipt requirements (IKPU/МХИК codes in payment details) apply to the organizer as the seller. The event form needs a field for their code.

### Stage 2: platform payments with automatic split

When volume justifies it, we contract a **licensed payment organization** that supports splitting one payment between the platform and the merchant:

- **ATMOS** advertises payment splits and one window for Uzcard, Humo, Visa, Mastercard, Click, Payme and Uzum.
- **Payme**'s Merchant API documentation mentions distributing a payment between the app owner and business partners.

How it would work:

- The attendee pays once. The provider splits the payment and pays out to the organizer, with our fee taken automatically.
- We need our own legal entity (ООО) and a contract.
- Each organizer is onboarded with the provider as a sub-merchant (KYC).
- Aggregators such as Multicard give one integration for several payment systems. A direct Merchant API per system gives more control over splits and refunds.

### Questions for the providers' sales teams (before stage 2)

1. Do you support **split/marketplace payments**, where one payment is split between the platform and a sub-merchant automatically? What are the fees?
2. Can **self-employed people and individuals** be sub-merchants? What KYC is needed?
3. Payout timing to the sub-merchant (T+0/T+1?), and how refunds work after a split.
4. Who issues the **fiscal receipt**: us, the organizer, or the provider? Which IKPU code applies to event tickets?
5. Can we take card payments from non-Uzbek cards (Visa/Mastercard) for foreign attendees?

### Alternative to watch

**Telegram Bot Payments** have supported Click Uzbekistan and Payme as providers via @BotFather; this needs re-checking today.
Each organizer would need their own provider token. It is the same "organizer's own merchant" model as stage 1, with checkout inside Telegram.

## 5. Tickets and check-in

- **Wallet pass:**
  - Apple `eventTicket` style; Google event ticket (or our approved generic class until event tickets are approved).
  - Shows the event, date, venue, attendee name and a QR.
  - `relevantDate` and the venue location make it appear on the lock screen at the right time.
- **QR content:** `https://<site>/t/<ticketId>.<signature>`.
  - The signature is an HMAC, so tickets cannot be forged or guessed.
  - Scanned with a normal camera, it opens the attendee's ticket page.
  - Scanned in the organizer's scanner, it checks the person in.
- **Check-in rules:**
  - valid signature, right event, status `confirmed`, not already used;
  - otherwise a clear red reason;
  - the first scan is stored with time and staff member.
- **Poor venue internet:** the scanner downloads the event's ticket list when opened. It verifies locally and syncs check-ins when back online, so a double scan on two phones is reconciled on sync.
- **Updates:**
  - The PassKit web service built for stats already registers devices. Next comes sending APNs pushes, so a time or venue change, or "checked in", updates the pass on the phone.
  - Google objects are updated through the API.

## 6. Architecture changes

The current app is stateless. Events need a real database and accounts.

| Need | Choice |
|---|---|
| Database | Postgres (Neon via Vercel Marketplace) + Drizzle ORM |
| Organizer auth | Telegram Login (signed widget data); attendees need no account |
| Files (covers, payment screenshots) | Vercel Blob. Screenshots are kept private and deleted 30 days after the event |
| Telegram bot | Webhook route in the same app; inline buttons to approve or reject |
| Background jobs | Vercel Cron: release expired holds, promote the waitlist, send reminders |
| Counters | Existing Upstash Redis |

**Data model:**

- `organizers` (slug, name, logo, telegram_id, plan)
- `events` (organizer, title, starts_at, venue, capacity, price, currency, payment_instructions, status)
- `registrations`:
  - links an event to the attendee: name, phone, telegram
  - status: `held → proof_sent → confirmed | rejected | expired | cancelled`, plus `checked_in_at`
  - reference code
- `payments` (registration, method `manual|payme|click`, amount, proof_url, provider_txn_id, reviewed_by)
- `passes` (registration, apple serial, google object id) for updates

**Privacy:**

- Attendee phone numbers and receipt screenshots are personal data.
- Collect only what the organizer asks for.
- Show a clear notice on the registration form.
- Delete screenshots after the event.

## 7. Build order

1. **Foundation:** DB + Drizzle, Telegram login, organizer profile page.
2. **Events:** create/edit event, public event page with OG image, capacity.
3. **Registration + manual payment:** holds, proof upload, approve/reject in the dashboard, waitlist, Cron for expiries.
4. **Tickets:** Apple/Google event passes, ticket page, signed QR.
5. **Check-in:** scanner page (reuses `barcode-detector`), offline list, results screen.
6. **Telegram bot:** organizer notifications with approve/reject buttons, attendee ticket delivery.
7. **History + stats:** per-event and per-organizer numbers.
8. **Pilot** with 3–5 English speaking clubs in Tashkent. Talk to Payme / Click / ATMOS in parallel (§4 questions).
9. **Stage 1 payments** (organizer's own Payme/Click merchant) for clubs that are ИП/ООО.

## 8. Open decisions

- **Brand and domain:** stay at wallet.myrzan.com, or a separate name for the B2B product?
- **Contact channel:** must attendees have Telegram, or is phone enough?
- **Pricing after the pilot:** monthly plan or per-ticket fee?
- **Our legal entity:** do we have an ООО/ИП? It decides when stage 2 is possible.
- **Refund and no-show policy:** set by each organizer, or a platform default?
