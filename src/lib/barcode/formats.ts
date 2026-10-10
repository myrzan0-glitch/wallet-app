export const BARCODE_FORMATS = [
  "qr",
  "code128",
  "ean13",
  "ean8",
  "upca",
  "code39",
  "codabar",
  "itf",
  "pdf417",
  "aztec",
  "datamatrix",
] as const

export type BarcodeFormat = (typeof BARCODE_FORMATS)[number]

export type Platform = "apple" | "google"

export const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  qr: "QR Code",
  code128: "Code 128",
  ean13: "EAN-13",
  ean8: "EAN-8",
  upca: "UPC-A",
  code39: "Code 39",
  codabar: "Codabar",
  itf: "ITF",
  pdf417: "PDF417",
  aztec: "Aztec",
  datamatrix: "Data Matrix",
}

/** Output formats offered in the UI for each wallet. */
export const PLATFORM_FORMATS: Record<Platform, BarcodeFormat[]> = {
  apple: ["qr", "code128", "ean13", "pdf417", "aztec"],
  google: ["qr", "code128", "ean13", "ean8", "upca", "code39", "pdf417", "aztec"],
}

export const TWO_D_FORMATS: BarcodeFormat[] = ["qr", "pdf417", "aztec", "datamatrix"]

/** Maps BarcodeDetector format names to ours. */
const DETECTOR_FORMATS: Record<string, BarcodeFormat> = {
  qr_code: "qr",
  code_128: "code128",
  ean_13: "ean13",
  ean_8: "ean8",
  upc_a: "upca",
  upc_e: "code128",
  code_39: "code39",
  code_93: "code128",
  codabar: "codabar",
  itf: "itf",
  pdf417: "pdf417",
  aztec: "aztec",
  data_matrix: "datamatrix",
}

export function fromDetectorFormat(format: string): BarcodeFormat {
  return DETECTOR_FORMATS[format] ?? "code128"
}

/** Picks the closest format the given wallet can display. */
export function toPlatformFormat(format: BarcodeFormat, platform: Platform): BarcodeFormat {
  if (PLATFORM_FORMATS[platform].includes(format)) return format
  return TWO_D_FORMATS.includes(format) ? "qr" : "code128"
}

function gtinCheckDigit(body: string): number {
  // Weights alternate 3,1,3,... starting from the rightmost digit of the body.
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i])
    sum += i % 2 === 0 ? digit * 3 : digit
  }
  return (10 - (sum % 10)) % 10
}

const GTIN_LENGTHS: Partial<Record<BarcodeFormat, number>> = { ean13: 13, ean8: 8, upca: 12 }

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: "empty" | "tooLong" | "digitsOnly" | "length" | "checksum" | "charset" }

/**
 * Validates a value for a format. For EAN/UPC a missing check digit is
 * appended, so typing the 12 visible digits of an EAN-13 also works.
 */
export function validateBarcode(format: BarcodeFormat, raw: string): ValidationResult {
  const value = TWO_D_FORMATS.includes(format) ? raw : raw.trim()
  if (!value) return { ok: false, error: "empty" }
  if (value.length > 512) return { ok: false, error: "tooLong" }

  const gtinLength = GTIN_LENGTHS[format]
  if (gtinLength) {
    if (!/^\d+$/.test(value)) return { ok: false, error: "digitsOnly" }
    if (value.length === gtinLength - 1) {
      return { ok: true, value: value + gtinCheckDigit(value) }
    }
    if (value.length !== gtinLength) return { ok: false, error: "length" }
    const expected = gtinCheckDigit(value.slice(0, -1))
    if (Number(value.at(-1)) !== expected) return { ok: false, error: "checksum" }
    return { ok: true, value }
  }

  switch (format) {
    case "code128":
      // Printable ASCII only; Apple encodes Code 128 messages as ISO-8859-1.
      if (!/^[\x20-\x7e]+$/.test(value)) return { ok: false, error: "charset" }
      if (value.length > 80) return { ok: false, error: "tooLong" }
      return { ok: true, value }
    case "code39":
      if (!/^[0-9A-Z\-. $/+%]+$/.test(value.toUpperCase())) return { ok: false, error: "charset" }
      return { ok: true, value: value.toUpperCase() }
    case "itf":
      if (!/^\d+$/.test(value)) return { ok: false, error: "digitsOnly" }
      if (value.length % 2 !== 0) return { ok: false, error: "length" }
      return { ok: true, value }
    case "codabar":
      if (!/^[0-9A-Da-d\-$:/.+]+$/.test(value)) return { ok: false, error: "charset" }
      return { ok: true, value }
    default:
      return { ok: true, value }
  }
}

/** Guesses a sensible output format for a manually typed value. */
export function guessFormat(value: string): BarcodeFormat {
  const v = value.trim()
  if (/^\d{13}$/.test(v) && validateBarcode("ean13", v).ok) return "ean13"
  if (/^[\x20-\x7e]{1,40}$/.test(v) && !/^https?:/i.test(v)) return "code128"
  return "qr"
}
