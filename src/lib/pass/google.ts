import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { put } from "@vercel/blob"
import { JWT } from "google-auth-library"
import { SignJWT, importPKCS8 } from "jose"

import type { BarcodeFormat } from "@/lib/barcode/formats"
import { TWO_D_FORMATS } from "@/lib/barcode/formats"
import { SITE_HOST, SITE_URL, googleConfig } from "@/lib/pass/config"
import { decodePngDataUrl, type PassRequest } from "@/lib/pass/schema"

const API = "https://walletobjects.googleapis.com/walletobjects/v1"

const GOOGLE_BARCODE_TYPES: Record<BarcodeFormat, string> = {
  qr: "QR_CODE",
  code128: "CODE_128",
  ean13: "EAN_13",
  ean8: "EAN_8",
  upca: "UPC_A",
  code39: "CODE_39",
  codabar: "CODABAR",
  itf: "ITF_14",
  pdf417: "PDF_417",
  aztec: "AZTEC",
  datamatrix: "DATA_MATRIX",
}

export class GoogleNotConfiguredError extends Error {}

type Config = NonNullable<ReturnType<typeof googleConfig>>

let client: JWT | undefined
let classReady: Promise<void> | undefined

function apiClient(config: Config) {
  client ??= new JWT({
    email: config.account.client_email,
    key: config.account.private_key,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  })
  return client
}

/** Creates the shared generic class once; every pass styles itself per object. */
function ensureClass(config: Config) {
  classReady ??= (async () => {
    const id = `${config.issuerId}.${config.classSuffix}`
    const api = apiClient(config)
    try {
      await api.request({ url: `${API}/genericClass/${id}` })
    } catch (error) {
      if ((error as { status?: number }).status !== 404) throw error
      await api.request({ url: `${API}/genericClass`, method: "POST", data: { id } })
    }
  })().catch((error) => {
    classReady = undefined
    throw error
  })
  return classReady
}

/**
 * Google needs a public URL for the logo. Logos are stored by content hash
 * (never with card data) when Vercel Blob is configured.
 */
async function hostLogo(logo: string | undefined): Promise<string | undefined> {
  if (!logo || !process.env.BLOB_READ_WRITE_TOKEN) return undefined
  const png = decodePngDataUrl(logo)
  const hash = createHash("sha256").update(png).digest("hex").slice(0, 32)
  const blob = await put(`logos/${hash}.png`, png, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return blob.url
}

const text = (value: string) => ({ defaultValue: { language: "en", value } })

export async function createGoogleSaveUrl(input: PassRequest): Promise<string> {
  const config = googleConfig()
  if (!config) throw new GoogleNotConfiguredError("Google Wallet is not configured")

  const [logoUrl] = await Promise.all([hostLogo(input.logo), ensureClass(config)])
  const [first, ...rest] = input.fields
  const barcode = input.barcode
  const showAltText = barcode && !TWO_D_FORMATS.includes(barcode.format) && barcode.value.length <= 40

  const object = {
    id: `${config.issuerId}.${randomUUID()}`,
    classId: `${config.issuerId}.${config.classSuffix}`,
    state: "ACTIVE",
    cardTitle: text(input.title),
    header: text(first?.value || input.title),
    ...(first?.label ? { subheader: text(first.label) } : {}),
    hexBackgroundColor: input.color,
    ...(logoUrl ? { logo: { sourceUri: { uri: logoUrl } } } : {}),
    ...(barcode
      ? {
          barcode: {
            type: GOOGLE_BARCODE_TYPES[barcode.format],
            value: barcode.value,
            ...(showAltText ? { alternateText: barcode.value } : {}),
          },
        }
      : {}),
    textModulesData: [
      ...rest.map((f, i) => ({ id: `f${i + 1}`, header: f.label, body: f.value })),
      { id: "made_with", header: "Wallet", body: `Created with ${SITE_HOST}` },
    ],
  }

  await apiClient(config).request({ url: `${API}/genericObject`, method: "POST", data: object })

  // The object already exists, so the save link only needs to reference its id.
  const key = await importPKCS8(config.account.private_key, "RS256")
  const token = await new SignJWT({
    iss: config.account.client_email,
    aud: "google",
    typ: "savetowallet",
    origins: [SITE_URL],
    payload: { genericObjects: [{ id: object.id }] },
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .sign(key)

  return `https://pay.google.com/gp/v/save/${token}`
}
