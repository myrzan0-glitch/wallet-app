import "server-only"

import { createHmac, randomUUID } from "node:crypto"
import { PKPass } from "passkit-generator"
import type { Barcode } from "passkit-generator"

import type { BarcodeFormat } from "@/lib/barcode/formats"
import { TWO_D_FORMATS } from "@/lib/barcode/formats"
import { hexToRgb, passColors } from "@/lib/pass/colors"
import { SITE_HOST, SITE_URL, appleConfig } from "@/lib/pass/config"
import { solidPng } from "@/lib/pass/png"
import { decodePngDataUrl, type PassRequest } from "@/lib/pass/schema"
import { passId } from "@/lib/stats/keys"

type AppleFormat = Barcode["format"]

/**
 * Apple shows the first barcode in the list the device supports, so formats
 * added in iOS 27 are followed by a Code 128 fallback for older devices.
 */
function appleBarcodes(format: BarcodeFormat, message: string): Barcode[] {
  const altText = TWO_D_FORMATS.includes(format) || message.length > 40 ? undefined : message
  const barcode = (f: AppleFormat): Barcode => ({
    format: f,
    message,
    // Latin-1 is what scanners expect; UTF-8 lets QR codes carry Cyrillic text.
    messageEncoding: /^[\x00-\xff]*$/.test(message) ? "iso-8859-1" : "utf-8",
    ...(altText ? { altText } : {}),
  })
  switch (format) {
    case "qr":
      return [barcode("PKBarcodeFormatQR")]
    case "pdf417":
      return [barcode("PKBarcodeFormatPDF417")]
    case "aztec":
      return [barcode("PKBarcodeFormatAztec")]
    case "ean13":
      return [barcode("PKBarcodeFormatEAN13"), barcode("PKBarcodeFormatCode128")]
    case "datamatrix":
      return [barcode("PKBarcodeFormatQR")]
    default:
      return [barcode("PKBarcodeFormatCode128")]
  }
}

export class AppleNotConfiguredError extends Error {}

/** Wallet calls this service when a pass is added to or removed from a device. */
export const APPLE_SERVICE_URL = `${SITE_URL}/api/passes/apple/service`

/** Per-pass token Wallet sends back to the service; derived, so nothing is stored. */
export function appleServiceToken(serialNumber: string, signerKey: string) {
  return createHmac("sha256", `wallet-service:${signerKey}`).update(serialNumber).digest("hex")
}

export async function createApplePass(input: PassRequest): Promise<Buffer> {
  const config = appleConfig()
  if (!config) throw new AppleNotConfiguredError("Apple Wallet signing is not configured")

  const colors = passColors(input.color)
  const fields = input.fields.map((f, i) => ({ key: `f${i}`, label: f.label || undefined, value: f.value }))
  const backFields = [
    {
      key: "madeWith",
      label: "Wallet",
      value: `Created with ${SITE_HOST}`,
      attributedValue: `Created with <a href="https://${SITE_HOST}">${SITE_HOST}</a>`,
    },
  ]

  const serialNumber = passId(input.template, randomUUID())
  // Wallet only talks to HTTPS services, so local builds skip it.
  const service = APPLE_SERVICE_URL.startsWith("https://")
    ? { webServiceURL: APPLE_SERVICE_URL, authenticationToken: appleServiceToken(serialNumber, config.signerKey) }
    : {}

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeId,
    teamIdentifier: config.teamId,
    organizationName: input.title,
    description: input.title,
    serialNumber,
    logoText: input.title,
    backgroundColor: colors.background,
    foregroundColor: colors.foreground,
    labelColor: colors.label,
    ...service,
    // With several fields the first (e.g. the Wi-Fi network name) is shown large.
    storeCard:
      fields.length > 1
        ? { primaryFields: fields.slice(0, 1), secondaryFields: fields.slice(1), backFields }
        : { secondaryFields: fields, backFields },
  }

  const icon = input.icon ? decodePngDataUrl(input.icon) : solidPng(87, hexToRgb(input.color))
  const buffers: Record<string, Buffer> = {
    "pass.json": Buffer.from(JSON.stringify(passJson)),
    "icon.png": icon,
    "icon@2x.png": icon,
    "icon@3x.png": icon,
  }
  if (input.logo) {
    const logo = decodePngDataUrl(input.logo)
    buffers["logo.png"] = logo
    buffers["logo@2x.png"] = logo
    buffers["logo@3x.png"] = logo
  }

  const pass = new PKPass(buffers, {
    wwdr: config.wwdr,
    signerCert: config.signerCert,
    signerKey: config.signerKey,
    signerKeyPassphrase: config.signerKeyPassphrase,
  })
  if (input.barcode) pass.setBarcodes(...appleBarcodes(input.barcode.format, input.barcode.value))
  return pass.getAsBuffer()
}
