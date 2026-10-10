# wallet.myrzan.com

Free web tool that turns any barcode or QR code into an **Apple Wallet** or
**Google Wallet** pass. Built for Uzbekistan first (UI in O‘zbekcha, Русский, Қазақша, English).

- **Research:** [`docs/research.md`](docs/research.md)
- **MVP plan:** [`docs/mvp-plan.md`](docs/mvp-plan.md)

## Stack

- **App:** Next.js 16 (App Router), shadcn/ui, Tailwind CSS v4.
- **Barcode reading:** `barcode-detector`, a ZXing WebAssembly build that runs in the browser. Its `.wasm` is served from `/zxing`, copied there on `npm install`.
- **Apple passes:** `passkit-generator`.
- **Google passes:** Google Wallet REST API plus a signed "Save to Google Wallet" JWT.
- **Card data is never stored or logged.** Only Google logos are uploaded (to Vercel Blob, keyed by content hash), because Google requires a public logo URL.

## Develop

```bash
npm install
cp .env.example .env.local   # fill in Apple / Google credentials
npm run dev                  # http://localhost:3000 → redirects to /uz, /ru or /en
```

Without credentials the UI works fully, but the "Add to … Wallet" buttons
report that the service isn't configured yet.

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

## Layout

```
src/app/[lang]/              page + layout (locale from the URL; proxy.ts redirects /)
src/app/api/passes/apple     POST → .pkpass (JSON body or form field `payload`)
src/app/api/passes/google    POST → { saveUrl }
src/components/creator/      form, camera scanner, live preview
src/lib/barcode/formats.ts   formats, validation (EAN/UPC checksums), wallet mapping
src/lib/pass/                schema, Apple + Google pass builders, config
src/lib/i18n/                uz / ru / kk / en dictionaries
```

## Deploy (Vercel + wallet.myrzan.com)

1. Import the repo in Vercel (framework: Next.js) and add the env vars from `.env.example`.
2. In Vercel → Domains, add `wallet.myrzan.com`.
3. At your DNS provider, add `CNAME wallet → cname.vercel-dns.com`, or whatever record Vercel shows.
4. Optional: create a Blob store in Vercel. `BLOB_READ_WRITE_TOKEN` is added automatically.
