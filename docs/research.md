# WalletWallet for Central Asia: Research

*Researched 2026-10-10. Scope: Kazakhstan (KZ), Uzbekistan (UZ), Kyrgyzstan (KG), Tajikistan (TJ), Turkmenistan (TM).*

> **How this was researched.** walletwallet.alen.ro and most primary sources were unreachable from the research
> environment, so most findings come from search-engine summaries of the linked pages, not full reads.
> Items marked **(unverified)** rest on a single secondary source or on conflicting sources. Check them before relying on them.

---

## 1. TL;DR

1. **A straight WalletWallet clone is a weak business in 2026.**
   - iOS 27 shipped on 2026-09-14 with a native **"Create a Pass"** feature in Apple Wallet. Google Wallet already has a similar feature ("Everything else").
   - Apple's developer licence (DPLA) also forbids signing passes for third-party brands with your own Pass Type ID. A consumer tool that turns a *Magnum* or *Korzinka* card into a pass sits in exactly that grey zone.
2. **What Central Asia adds:**
   - **Android-heavy markets.** UZ is ~83% Android and TJ ~79%.
   - **Patchy Google Wallet coverage.** UZ is unconfirmed and TM is not supported.
   - **Weak localization in global tools** (ru / uz / kk).
   - **Telegram as the main distribution channel**, especially in UZ.
   - **Small businesses still running paper stamp cards.**
3. **Recommended positioning:**
   - **Free consumer converter.** Localized and multi-target: Apple Wallet, Google Wallet, *and* an offline PWA / Telegram Mini App card for anyone without a wallet. This is the top of the funnel.
   - **Paid self-serve B2B stamp and loyalty cards** for cafés, gyms and salons. These are updatable passes issued under the *business's own brand*, which is DPLA-friendly. Bill via Kaspi Pay in KZ and Payme/Click in UZ.
4. **Launch order:**
   - **KZ first:** highest iOS share (~41–46%), Apple Pay since 2018, Google Wallet supported.
   - **Then UZ:** largest population, Telegram-first, but needs the non-Google-Wallet fallback.
   - **KG and TJ** are small but newly wallet-enabled (Apple Pay launched 2026-07-28).
   - **Skip TM:** Google Play is blocked, internet access is default-deny, and Cloudflare-proxied sites are unreachable.
5. **Validate before building:**
   - Save a Google Wallet pass on a real Uzbek device and SIM.
   - Check that a Code128 re-encoding of an EAN-13 card scans at local tills.
   - Check whether the big grocers' app QR codes are static or rotating.
   - Make sure you can actually pay for an Apple Developer account (payment failures are reported from KZ, UZ and KG).

---

## 2. What WalletWallet is

| Aspect | Findings |
|---|---|
| **Maker** | Alen Todorov. Show HN launch 2025-12-22. #5 Product of the Day on Product Hunt. Reports "21,000 passes" generated (self-reported). |
| **User flow** | Scan with the camera, upload an image, or type the code (decoded locally in the browser). Pick a format (QR / Aztec / PDF417 / Code128). Style it (colour, logo, live preview). Download a signed `.pkpass` or **Add to Google Wallet** (added in v2). |
| **Extras** | "Tags" social-handle passes for 14 services (Instagram, Telegram, VK, GitHub, Spotify…), each with its own SEO landing page. Browser tools: PKPASS viewer, PKPASS→PDF, PKPASS→Google Wallet. |
| **Not supported (free tool)** | Push updates, batch creation, saved collection, multi-language UI. |
| **Architecture** | Cloudflare Workers ("to keep it low-cost"). Decoding runs in the browser, but **signing is on the server** with the maker's Apple certificate, because the private key can't ship to the browser. So "no data stored" is true, but the data still passes through the server. |
| **Open source?** | One article says yes, but no repo was found; the maker promised a "BYOK version" later. **(unverified, likely not)** |
| **Developer API** (`api.walletwallet.dev`) | Bearer key. `POST /api/passes` → `{serialNumber, googleSaveUrl, applePass(base64)}`. `PUT /api/passes/{serial}` updates the pass and pushes it to devices. `GET /api/auth/usage`. Body: `barcodeValue`, `barcodeFormat`, `logoText`, `colorPreset`, `color` (Pro), `expirationDays`, `header/primary/secondary/backFields`. |
| **Pricing** | Free: 1,000 passes/mo. Pro: 100k/mo, **$39/mo** (was $19). Business: 1M/mo, $99/mo. On paid plans you can bring your own Apple certificate or Google issuer. |
| **Growth engine** | SEO. A "How to create Apple Wallet passes from any loyalty card for {cafés / groceries / retail}" template; competitor-comparison pages (PassKit, PassSlot, WalletThat, PassNinja, Pass2U, Pass4Wallet); a .pkpass explainer; an iOS 27 explainer. |
| **Criticism** | Privacy (data goes to someone else's signing server); static passes; passes stacking in Wallet; iOS 27 making the core use case free. The maker's own blog now pivots to Google Wallet and the café/gym long tail. |

**Takeaway:** WalletWallet is a free SEO and top-of-funnel tool that feeds a paid pass-issuing API. Copy that *model*, not just the converter.

---

## 3. Central Asia market

### 3.1 Country snapshot

| | KZ | UZ | KG | TJ | TM |
|---|---|---|---|---|---|
| Population | ~20.9M | ~37.2M | ~7.3M | ~10.8M | ~7.7M |
| Internet penetration (end-2025) | 93% | 89% | 89% | 57% | 46% |
| Android / iOS (StatCounter, page views) | ~54–59 / 41–46 | 83 / 17 | 73 / 27 | ~79 / 21 | n/a (Android-heavy) |
| Apple Pay | ✅ since 2018 | ❌ expected "within months" | ✅ 2026-07-28 | ✅ 2026-07-28 | ❌ |
| Google Pay | ✅ since 2021 | ❌ | ✅ since 2022 | ✅ since 2024 | ❌ |
| Google Wallet *passes* | Likely ✅ | **❓ unconfirmed** | Likely ✅ | Likely ✅ | ❌ |
| Apple Wallet *passes* (non-payment) | ✅ | ✅ (unverified) | ✅ | ✅ | ✅ in theory |
| Main messenger | WhatsApp | **Telegram** (~70–76%) | WhatsApp | Telegram / IMO / WhatsApp | restricted |
| UI languages | ru, kk (Cyrillic) | uz-Latn, ru | ru, ky | tg, ru | tk, ru |

- **Apple Wallet without Apple Pay.** Non-payment `.pkpass` files can be added in any region; only payment cards are geo-restricted. iPhone passes should therefore work in all five countries.
- **Google Wallet without a supported region.** Google says passes are only for users in supported regions. A Tashkent vendor (Kardly) nevertheless claims to issue "Google Pay" cards, so test this on a real UZ device.
- **Uzbekistan's 2026 data law.** The law amended on 2026-03-26 relaxes localization so Apple Pay and Google Pay can launch. Expect both in UZ soon, which would make UZ much more attractive.

### 3.2 Is there a real consumer use case?

**Big grocers are moving to app-only cards, often with personalized or rotating QR codes:**
- KZ: Galmart; the Magnum Club app (though a plastic Magnum card is still sold).
- UZ: the Korzinka Plus app QR code, also integrated into Payme; Makro via the e-Makro, Click and Uzum apps.
- KG: Globus; SPAR.

**Where static barcode cards still dominate** (EAN-13 and Code128 typical, **unverified**):
- older plastic cards
- pharmacies, fuel stations
- gyms, cinemas
- small chains, gift cards, library and student cards

**Phone-number programs** are common; electronics chains (Sulpak, Technodom) mostly use them. They need a "show the number" card rather than a barcode.

**Consumer competitors:**
- **Кошелёк (Cardsmobile)**, which has entered KZ
- **CartaMe** (KZ aggregator)
- **Payme**'s loyalty-cards section (partner integrations only)
- open-source **Catima** on Android
- and now **iOS 27 natively**

### 3.3 B2B (stamp and loyalty cards for small businesses)

Demand is proven but the market is contested:

| Player | Market | Notes |
|---|---|---|
| **Kardly** | UZ | Claims 1,200+ businesses; from 239,000 UZS/mo; Apple Wallet + "Google Pay" |
| vCard.uz | UZ | — |
| Wallets.kz, TuviS, AppGrade | KZ | Stamp and bonus cards; push and geo triggers (TuviS) |
| UDS, Mace Loyalty, OSMI Cards, CARDPR | Russia → CIS | iiko / r_keeper POS integrations |

**Differentiation angles:**
- self-serve onboarding in minutes
- Uzbek and Kazakh UI
- **Telegram bot / Mini App** as both the customer card and the staff stamping tool
- a Kaspi QR / Payme / Click tie-in
- a much cheaper entry tier

### 3.4 Distribution

- **UZ:** Telegram channels, Telegram Ads (open to local advertisers since 2024), and a Telegram Mini App.
- **KZ and KG:** Instagram (KZ ~12.4M users; KG ~79% of adults) plus WhatsApp.
- **Everywhere:** Russian-language SEO, which global tools ignore. Mirror WalletWallet's playbook with pages like «Как добавить карту Magnum в Apple Wallet» ("How to add a Magnum card to Apple Wallet") and «Korzinka kartasini Google Wallet'ga qo'shish» ("Adding a Korzinka card to Google Wallet").

---

## 4. Technical findings

### Apple Wallet (`.pkpass`)

- **Package.** A `.pkpass` is a ZIP containing `pass.json`, `manifest.json` (SHA-1 of every file), images, and a `signature`. The signature is a detached PKCS#7 signature over the manifest, made with the Pass Type ID certificate plus the Apple WWDR (G4) intermediate. Signing **must be server-side**.
- **Styles.** `storeCard` (strip image; best for loyalty), `generic`, `coupon`, `eventTicket`, `boardingPass`. iOS 27 adds a "Poster Generic" style.
- **Barcodes.**
  - Before iOS 27: **QR, PDF417, Aztec, Code128 only.** EAN-13 cards had to be re-encoded as Code128 (will a till accept it? **unverified**) or drawn as a strip image (not guaranteed to scan).
  - iOS 27 adds **EAN-13, Code 39, Codabar, ITF**. Put the native format first in `barcodes[]` with a Code128 fallback for iOS ≤ 26, and always print the number in plain text.
- **Localization.** `ru.lproj/`, `uz.lproj/`, `kk.lproj/` with `pass.strings`.
- **Updates.** `webServiceURL` + `authenticationToken`, the device-registration endpoints, and an APNs push. This is what B2B stamp cards need.
- **NFC.** Needs a per-Pass Type ID entitlement that Apple grants selectively. Out of scope.
- **⚠️ Licence.** The DPLA lets you distribute passes signed with your Pass Type ID only "under Your own trademark or brand", and you may not "sign a third party's pass".
  - For the consumer tool: use user-entered titles and user-uploaded logos only, and ship **no retailer logo gallery**.
  - For B2B: issue under the business's brand. Ideally let larger clients bring their own certificate.
- **⚠️ Enrollment.** Apple Developer Program costs $99/yr. 2026 forum threads report card payments from KZ, UZ and KG never being authorized. Plan to pay with a card or entity that works.

### Google Wallet

- **Model.** A Class (template) plus Objects (one per user), Generic or Loyalty type. The "Save to Google Wallet" link is `https://pay.google.com/gp/v/save/{JWT}`, signed with a service-account key. No server-side storage is needed for static passes.
- **Barcodes.** Supported natively: **EAN_13**, EAN_8, UPC_A, CODE_39, CODE_128, ITF_14, CODABAR, DATA_MATRIX, AZTEC, QR, PDF_417, TEXT_ONLY.
- **Issuer account.** Starts in **demo mode** (passes show "[TEST ONLY]" and go to test users only). Publishing access needs Google approval and a business profile. Whether a Central Asian entity can get approved is **unknown**, so apply early, or use a foreign entity.

### Browser scanning

- Native `BarcodeDetector` is missing in Firefox and off by default in iOS Safari, so use the **`barcode-detector`** npm polyfill (zxing-wasm).
- Avoid `html5-qrcode` (unmaintained since 2023).

### Libraries

- **Apple passes:** `passkit-generator` (Node/TS) or `@walletpass/pass-js` (Node).
- **Google:** `google-wallet/rest-samples` plus a JWT library.
- **Android fallback:** Catima / Pass2U can open `.pkpass`. A PWA card is still the universal fallback.

### Hosting

- **Stateless signer:** Cloudflare Workers, or Hetzner Frankfurt behind Cloudflare, is fine. Cloudflare has PoPs in Almaty, Astana and Bishkek (**unverified**); EU latency is ~65–90 ms.
- **Once you store data** (accounts, B2B customers, pass registrations), look at local hosting (KZ: 24SaaS / Kazakhtelecom; UZ: local DCs). See the legal section below.

---

## 5. Legal and regulatory (not legal advice)

| Country | Personal-data localization | Impact |
|---|---|---|
| **KZ** | Law 94-V Art. 12(2): personal data stored in KZ. Breach notification required since 2024-07-01. A draft decree to relax this (AmCham, May 2026) is **not confirmed adopted**. | A stateless converter is low risk, as long as you don't log card numbers or names. A B2B product with customer records → host a copy in KZ. |
| **UZ** | Amended 2026-03-26. Only biometric, genetic and telecom-subscriber data must stay local. Other data may go abroad under adequacy / SCCs / BCRs. | Much more flexible than before. |
| **KG** | Law No. 58 (amended 2021). Transfers allowed to adequate countries; personal-data arrays must be registered. | Register if storing data. |
| **TJ** | Law No. 1537 (2018). No explicit localization. | Low risk. |

**Trademarks.** Don't ship retailer logos; let users upload their own. This also lines up with the Apple DPLA.

---

## 6. Monetization and payments

- **Stripe** does not support KZ or UZ accounts. To use it you'd need a US/UK/EE entity.
- **Merchant-of-record services:** Paddle charges KZ VAT (16%) and UZ VAT (12%), but payouts to a local entity are **unverified**. Lemon Squeezy signups are reportedly gated.
- **Local acquiring** (needs a local IP/TOO or LLC):
  - **KZ:** **Kaspi Pay** (dominant; ~1% fee, **unverified**; fiscal receipts required unless Kaspi Kassa is used), TipTopPay (ex-CloudPayments KZ), Freedom Pay. **ApiPay.kz** offers a Kaspi invoice API.
  - **UZ:** Payme, Click, Uzum, Octo, Multicard. The `tolov` SDK unifies them.
- **Tax-advantaged entities** (sources disagree on dates; confirm with a local adviser):
  - **Astana Hub (KZ):** 0% CIT and VAT exemption for IT activities, reportedly until 2029-01-01.
  - **IT Park (UZ):** 1% turnover tax and 7.5% PIT, but with export-share requirements (20% in 2026, 35% in 2027).

**Suggested pricing**, benchmarked against Kardly's 239k UZS/mo (~$19):
- **Consumers:** free, forever.
- **B2B Free:** 1 card design, ≤100 customers.
- **B2B Starter:** ~$7–10 / mo (~3,500–5,000 ₸ / 90–125k UZS).
- **B2B Pro:** ~$20–25 / mo, with push campaigns, geo triggers, POS/Telegram stamping and analytics.
- **API:** a usage tier for developers, as WalletWallet has.

---

## 7. Recommended product and MVP

### Phase 0: validation (1–2 weeks)

1. Get the Apple Developer account and a Pass Type ID, and confirm the payment goes through.
2. Create a Google Wallet issuer account and apply for publishing access.
3. Run field tests:
   - Add a test pass to Google Wallet on a UZ device and SIM.
   - Scan a Code128-re-encoded EAN-13 card at Magnum, Small and Korzinka tills.
   - Check whether Korzinka, Galmart and Magnum app QR codes are static.
4. Interview 10–15 cafés, gyms and salons in Almaty and Tashkent about their stamp cards.

### Phase 1: consumer converter MVP (free, top of funnel)

- **Input:** camera or image scan (`barcode-detector` polyfill) or manual entry. Formats: EAN-13/8, UPC, Code128, Code39, QR, PDF417, Aztec. Plus a "number only" mode for phone-based programs.
- **Styling:** title, colour, uploaded logo, live Apple/Google preview.
- **Outputs:**
  - `.pkpass` (EAN-13 native + Code128 fallback)
  - Save to Google Wallet (native EAN-13)
  - **offline PWA card** (add-to-home-screen; for UZ and other users without Google Wallet)
  - **Telegram Mini App / bot** card
- **i18n:** ru, uz-Latn, kk, en (later ky, tg).
- **Privacy:** stateless signer; no logging of barcode values; Plausible-style privacy analytics.
- **SEO:** a landing page per popular local loyalty program and per wallet × language, without logos and with a "not affiliated" disclaimer.

### Phase 2: B2B stamp and loyalty cards (revenue)

- **Business dashboard:** card designer, stamp/points rules, customer list.
- **Customer journey:** a QR code at the till takes the customer to a web page, which issues a personalized pass (Apple + Google + Telegram).
- **Updatable passes:** Apple web service + APNs; Google object PATCH. Staff stamp cards by scanning with a Telegram bot or PWA.
- **Push campaigns, geo/beacon triggers.**
- **Billing** via Kaspi Pay / Payme / Click.
- **Data:** stored in-country (KZ) once you hold customer data.

### Suggested stack

- **Frontend:** SvelteKit or Next.js PWA + Telegram Mini App SDK; `barcode-detector`; i18n framework.
- **Backend:** Node/TypeScript; `passkit-generator`; Google Wallet JWT via `google-auth-library`. Deploy on Cloudflare Workers (stateless phase) or a Node service in a KZ DC (B2B phase).
- **Storage (phase 2):** Postgres with a pass-registration table for Apple push.

---

## 8. Open questions and risks

| Risk | Severity | Mitigation |
|---|---|---|
| iOS 27 native "Create a Pass" and Google's "Everything else" | High (consumer) | Lead with B2B. Win on localization, Android and Telegram, and on iOS ≤ 26 users. |
| Apple DPLA "own brand" clause | High | No retailer logos; B2B passes under the merchant's brand; BYO certificate for larger clients. |
| Google Wallet unavailable in UZ / TM | High (UZ) | PWA + Telegram card fallback; re-test as Google Pay launches in UZ. |
| Apple Developer enrollment payment failures | Medium | Pay with a card or entity that works. |
| Rotating QR codes at big retailers | Medium | Focus on static cards and B2B. |
| Strong local B2B incumbents (Kardly, Wallets.kz, UDS) | Medium | Self-serve, cheaper, Telegram-native, Uzbek/Kazakh UI. |
| KZ data localization | Medium (B2B) | Host in KZ for stored data; track the draft decree. |

---

## Sources

**WalletWallet**
- https://walletwallet.alen.ro/
- https://walletwallet.alen.ro/blog/create-apple-wallet-pass-free/
- https://walletwallet.alen.ro/blog/ios-27-wallet-create-pass/
- https://walletwallet.alen.ro/blog/pkpass-file/
- https://www.producthunt.com/p/walletwallet/walletwallet
- https://news.ycombinator.com/item?id=46345745
- https://www.g2.com/products/walletwallet-api/discuss
- https://www.appgefahren.de/?p=395696
- API client code: https://github.com/dhk/walletwallet-mcp, https://github.com/kh7zhm7mkh-crypto/pretix_walletwallet

**iOS 27 Create a Pass**
- https://www.macrumors.com/2026/06/08/ios-27-wallet-create-pass/
- https://9to5mac.com/2026/05/04/ios-27-apple-wallet-adding-new-create-a-pass-feature-per-report/
- https://developer.apple.com/videos/play/wwdc2026/209/
- https://support.google.com/wallet/answer/12060038

**Apple**
- https://developer.apple.com/documentation/walletpasses/building-a-pass
- https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes
- https://developer.apple.com/forums/thread/741159
- https://developer.apple.com/forums/thread/839561
- https://developer.apple.com/forums/thread/845866
- https://discussions.apple.com/thread/255606085

**Google Wallet**
- https://support.google.com/wallet/answer/12060037
- https://developers.google.cn/wallet/reference/rest/v1/BarcodeType
- https://developers.google.com/wallet/docs/release-notes

**Market data**
- DataReportal 2026: https://datareportal.com/reports/digital-2026-kazakhstan (and -uzbekistan, -kyrgyzstan, -tajikistan, -turkmenistan)
- StatCounter: https://gs.statcounter.com/os-market-share/mobile/kazakhstan (and uzbekistan, kyrgyzstan, tajikistan)

**Apple Pay / Google Pay launches**
- https://www.mactrast.com/2018/11/apple-pay-launches-in-belgium-and-kazakhstan/amp/
- https://economist.kg/dengi/2026/07/28/apple-pay-zapusk-kyrgyzstan/
- https://alif.tj/en/applepay/visa
- https://kun.uz/en/news/2026/07/08/uzbekistan-prepares-for-apple-pay-and-google-pay-launch-d2df7e
- https://daryo.uz/en/2026/07/30/central-bank-of-uzbekistan-advances-apple-pay-google-pay-integration/

**Loyalty programs, competitors and distribution**
- https://finance.kz/articles/kak-sekonomit-v-magnume
- https://galmart.kz/articles/article/5
- https://blog.payme.uz/korzinka-plus-v-payme/
- https://kardly.uz/en
- https://wallets.kz/
- https://tuvis.kz/apple-wallet/
- https://koshelek.app/
- https://ca-barometer.org/en/publications/which-messaging-apps-are-popular-in-uzbekistan-kyrgyzstan-and-kazakhstan

**Legal**
- https://adilet.zan.kz/eng/docs/Z1300000094
- https://amcham.kz/wp-content/uploads/2026/05/2026-05-15_AmCham_DataLocalization_Issue-Brief_ENG_v5.pdf
- https://kun.uz/en/news/2026/03/27/uzbekistan-amends-personal-data-law-to-facilitate-global-payment-systems
- https://www.dlapiperdataprotection.com/?t=law&c=KG

**Payments and tax**
- https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for
- https://github.com/bazarbaykz/apipay-docs
- https://pypi.org/project/tolov/
- https://www.ey.com/en_uz/technical/tax-alerts/2026/01/uzbekistan-tax-updates-2026

**Libraries**
- https://www.npmjs.com/package/passkit-generator
- https://www.npmjs.com/package/barcode-detector
- https://github.com/CatimaLoyalty/Android
