# MVP Plan: Web Pass Creator (Uzbekistan first)

*Status: M0–M3 code done (UI, scanning, Apple signing). Waiting on Apple/Google credentials and deploy. Last updated 2026-10-10.*

## 1. Goal

A free web tool at **wallet.myrzan.com** that turns any barcode or QR code into an
**Apple Wallet** and a **Google Wallet** pass in under 30 seconds. No sign-up, nothing stored.

This is the B2C wedge from `docs/research.md`. The B2B loyalty product comes later, built on the users this brings in.

### Success criteria for the MVP

- A user on iPhone Safari or Android Chrome can go from opening the site to having the pass in their wallet in **≤ 30 s**.
- Scanned and manually entered codes produce a pass that **scans correctly at a real till**: QR, Code128 and EAN-13 tested in Tashkent stores.
- UI in **O'zbekcha (Latin)**, **Русский** and **English**.
- No card data is persisted or logged on the server.

## 2. Scope

### In the MVP

| # | Feature | Notes |
|---|---|---|
| 1 | **Web app** (mobile-first, works on desktop) | Single page with 3 steps |
| 2 | **Barcode + QR** | QR, Code128, EAN-13 (auto-detected); see §5 |
| 3 | **Customization** | Background colour, title, logo, field label + value |
| 4 | **Input methods** | Camera scan, image upload, manual entry |
| 5 | **shadcn/ui** design system | Tailwind + Radix primitives |
| 6 | **Apple Wallet** `.pkpass` download | Signed on the server |
| 7 | **Google Wallet** "Save" link | Signed JWT |
| 8 | **Live preview** | Card mock that updates as the user edits |
| 9 | **i18n** uz / ru / en | Auto-detected, with a switcher |

### Not in the MVP (later)

- **v1.1:**
  - templates: PINFL / "Hujjatlarim" (My documents), Wi-Fi, card number for transfers, Instagram/Telegram profile
  - share link and "made with" footer on the pass
- **v1.2:** install/uninstall tracking via Apple `webServiceURL` (needs a database)
- **Later:**
  - Telegram bot / Mini App
  - accounts
  - pass updates and push
  - B2B dashboard

## 3. User flow

The UI follows WalletWallet's layout: one form under two wallet tabs.

```
┌───────────────────────┬───────────────────────┐
│     Apple Wallet     │     G Google Wallet   │  ← tab chosen from the device (Android → Google)
├───────────────────────┴───────────────────────┤
│ Scan or Upload Code              🛡 Processed locally │
│ [ 📷 Scan with Camera ]  [ ⇪ Upload Image ]   │
│ ──────────── OR ENTER MANUALLY ────────────   │
│ Barcode Data [ 4780000123454 ]  Format [EAN-13▾]│
│ Pass Title [ Korzinka ]                       │
│ Pass Logo (Optional) [ Upload Logo ]          │
│ Label [ Card number ]   Value [ 12345 ]       │
│ Color ● ● ● ● ● ● ● ● 🌈                       │
│ Preview  ┌──────────────────────┐              │
│          │ Korzinka             │              │
│          │ CARD NUMBER 12345    │              │
│          │ ║║│║║│║│║║│║║         │              │
│          └──────────────────────┘              │
│ [  Add to Apple Wallet ]                      │
└───────────────────────────────────────────────┘
```

**Behaviour:**
- The form state is shared between the tabs. Switching tabs maps the chosen format to one the wallet supports.
- The format is auto-detected from a scan or upload, and guessed from typed input until the user picks one.

**Edge cases to handle:**

- **In-app browsers.** On iOS, Telegram and Instagram open links in their own in-app browser, and `.pkpass` downloads often fail there. Detect these browsers and show an "Open in Safari" hint with a copy-link button. This is critical because most traffic in UZ will come from Telegram.
- **Camera permission denied** → fall back to upload or typing.
- **Phone-number loyalty programs** (no barcode) → allow "number only" (no barcode, value shown as text).

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | First-class shadcn support; API routes for signing in the same repo |
| UI | **shadcn/ui** + Tailwind CSS + lucide icons | As requested |
| Forms | react-hook-form + zod | shadcn `Form` pattern; the same zod schema validates on the server |
| i18n | next-intl | `/uz`, `/ru`, `/en` routes; good for SEO |
| Scanning | `barcode-detector` (zxing-wasm polyfill) | Works in iOS Safari, where native `BarcodeDetector` is off; the same engine handles camera and image upload |
| Barcode rendering (preview) | `bwip-js` | Renders QR, Code128, EAN-13 as SVG in the browser |
| Apple passes | `passkit-generator` | Mature Node library; signs with Pass Type ID cert + WWDR G4 |
| Google passes | Google Wallet REST API + `google-auth-library` (JWT) | Official |
| Logo hosting (Google needs a public URL) | Vercel Blob or Cloudflare R2, keyed by content hash | Only the logo image is stored, never card data |
| Hosting | **Vercel** (Node runtime for signing) | Zero-config Next.js; custom domain via CNAME |
| Analytics | Plausible or Umami (cookie-less) | Events only: `pass_created {platform, format, input_method}`, never values |
| Rate limiting | Upstash Ratelimit (or Vercel firewall) | Protect the signing endpoints |

**Alternative:** Cloudflare Workers via OpenNext, which is cheaper at scale and is what WalletWallet uses. The catch is that `passkit-generator` relies on Node crypto/forge, which needs `nodejs_compat` testing. Start on Vercel and revisit if costs matter. Vercel's Hobby tier is for non-commercial use, so move to Pro ($20/mo) once there is revenue.

## 5. Barcode format strategy

| Input detected | Apple Wallet (iOS ≤ 26 safe) | Google Wallet | Preview |
|---|---|---|---|
| QR | `PKBarcodeFormatQR` | `QR_CODE` | QR |
| Code128 | `PKBarcodeFormatCode128` | `CODE_128` | Code128 |
| EAN-13 / EAN-8 / UPC-A | **`PKBarcodeFormatCode128`** encoding the same digits; `altText` = the number | `EAN_13` / `EAN_8` / `UPC_A` (native) | EAN-13 |
| Other 1D (Code39, ITF, Codabar) | Code128 fallback | native type | as detected |

- **Why Code128 for EAN-13 on Apple:** before iOS 27, Apple Wallet only supports QR, PDF417, Aztec and Code128. iOS 27 adds EAN-13, but the exact `pass.json` constant is unverified. Plan: once the constant is confirmed, put the native EAN-13 format first in the `barcodes[]` array (iOS uses the first format it supports) and keep Code128 as the fallback.
- **⚠️ Field test before launch:** does a Code128-encoded EAN-13 scan at Korzinka, Makro and Havas tills? If not, the fallback is to show the number big (cashier types it in) and recommend Google Wallet or the iOS 27 native format.
- **Manual entry:** a format picker (Auto / QR / Code128 / EAN-13), with EAN-13 checksum validation and an auto-fix suggestion.

## 6. Pass design mapping

| UI field | Apple `pass.json` (style `storeCard`) | Google `genericObject` |
|---|---|---|
| Title | `logoText` + `organizationName` | `cardTitle` |
| Label / Value | `primaryFields[0]` | `header` (value) + `subheader` (label) |
| Colour | `backgroundColor`; `foregroundColor` / `labelColor` auto-picked for contrast | `hexBackgroundColor` |
| Logo | `logo.png` @1x/2x/3x (≤160×50 pt) + `icon.png` (required; generated from logo or default) | `logo.sourceUri` (public URL; shown circle-masked) |
| Barcode | `barcodes[]` + `altText` | `barcode {type, value, alternateText}` |
| — | back field: "Created with wallet.myrzan.com" | `textModulesData` footer |

- **Logo processing:** done in the browser with a canvas. Resize, convert to PNG, strip EXIF, cap at 300 KB.
- **Colour presets:** a set of 8 plus a custom picker. Text colour is computed automatically from contrast; there is no separate text-colour picker.

## 7. API design

```
POST /api/passes/apple
  body (multipart): title, label, value, barcodeFormat, barcodeValue, color, logo?
  → 200 application/vnd.apple.pkpass  (Content-Disposition: attachment; filename=pass.pkpass)

POST /api/passes/google
  body (json): same fields + logoUrl?
  → 200 { saveUrl: "https://pay.google.com/gp/v/save/<jwt>" }

POST /api/logo            (only needed for Google)
  body: png ≤300KB → { url }  (content-hash key, immutable, cached)
```

- **Validation:** the same zod schema on client and server. Length limits: title ≤ 30, label ≤ 20, value ≤ 64, barcode ≤ 512.
- **Signing:** done in memory, response streamed, nothing written to disk. Request bodies are never logged.
- **Google approach:** create the `genericObject` via the REST API, then return a short JWT that references its ID. Inline objects in the JWT can exceed URL length limits.
  - **Per-pass class (Option A):** one `genericClass` per pass. More API calls.
  - **Shared default class (Option B):** a single class, with each object overriding its own colour, logo and title. Fewer calls. **Choose B.**

**Secrets (env):**
- Apple: `APPLE_TEAM_ID`, `APPLE_PASS_TYPE_ID`, `APPLE_SIGNER_CERT_PEM`, `APPLE_SIGNER_KEY_PEM`, `APPLE_SIGNER_KEY_PASSPHRASE`, `APPLE_WWDR_PEM`
- Google: `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`

## 8. Project structure

```
wallet-app/
├─ app/[locale]/page.tsx          # the 3-step creator
├─ app/[locale]/privacy/page.tsx
├─ app/api/passes/apple/route.ts
├─ app/api/passes/google/route.ts
├─ app/api/logo/route.ts
├─ components/ui/*                # shadcn generated
├─ components/creator/            # CodeInput (Scan|Upload|Type), DesignForm, PassPreview, AddButtons
├─ lib/pass/schema.ts             # shared zod schema
├─ lib/pass/apple.ts              # passkit-generator wrapper
├─ lib/pass/google.ts             # Wallet REST + JWT
├─ lib/barcode/                   # detect, normalize, EAN checksum, format mapping
├─ messages/{uz,ru,en}.json       # translations
└─ docs/
```

## 9. Milestones (focused, ~2 weeks)

| # | Milestone | Done when |
|---|---|---|
| M0 | **Setup**: Next.js + shadcn + next-intl + deploy to `wallet.myrzan.com` | Hello page live on the subdomain over HTTPS, in 3 languages |
| M1 | **Code input**: Type, Upload, Scan tabs | All 3 methods return `{format, value}` for QR, Code128, EAN-13; tested on iPhone Safari + Android Chrome |
| M2 | **Design + live preview** | Form changes reflect instantly; logo resized client-side |
| M3 | **Apple pass** | `.pkpass` opens the "Add" sheet on iPhone; scans at a till |
| M4 | **Google pass** | Save link adds the pass on an Android phone with a UZ account |
| M5 | **Launch polish** | In-app-browser hint, privacy page, analytics, rate limit, OG/share images, uz/ru copy reviewed by a native speaker |

## 10. What you need to prepare (blocking)

1. **Apple Developer Program** ($99/yr). Enroll; have a backup card ready, since Uzbek card payments are often declined.
   - Create a Pass Type ID, e.g. `pass.com.myrzan.wallet`.
   - Download the certificate, export it as `.p12`, and send it to me securely. Don't commit it.
2. **Google Wallet:**
   - Create a Google Cloud project and enable the Google Wallet API.
   - Create a service account and a JSON key.
   - Create an issuer account in the Pay & Wallet Console and link the service account.
   - Apply for **publishing access** early; until approved, passes show "[TEST ONLY]".
3. **DNS for myrzan.com:** a `CNAME wallet → cname.vercel-dns.com` record (or I'll give you the exact record after setup).
4. **Vercel account** (or tell me if you prefer another host).
5. **Test devices:** one iPhone and two Android phones (Samsung + Xiaomi) with UZ SIMs, plus 3 real loyalty cards to test at tills.

## 11. Open decisions

| Decision | Default chosen | Alternative |
|---|---|---|
| Product name / brand | "myrzan wallet" (placeholder) | Pick a catchy Uzbek or Russian name for virality |
| Hosting | Vercel | Cloudflare Workers (OpenNext) |
| Apple pass style | `storeCard` | `generic` (better for documents, e.g. PINFL) |
| Default language | uz (Latin), falling back to ru by browser locale | ru first |
| Extra formats in MVP | QR, Code128, EAN-13 (+ PDF417 and Aztec for free) | QR + Code128 only |
