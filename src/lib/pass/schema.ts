import { z } from "zod"

import { BARCODE_FORMATS, validateBarcode } from "@/lib/barcode/formats"

export const LIMITS = {
  title: 40,
  label: 24,
  value: 64,
  barcode: 512,
  /** Max decoded PNG size for logo / icon. */
  imageBytes: 300 * 1024,
} as const

const pngDataUrl = z
  .string()
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Expected a PNG data URL")
  .refine((s) => (s.length - "data:image/png;base64,".length) * 0.75 <= LIMITS.imageBytes, "Image too large")

export const passRequestSchema = z
  .object({
    barcodeFormat: z.enum(BARCODE_FORMATS),
    barcodeValue: z.string().min(1).max(LIMITS.barcode),
    title: z.string().trim().min(1).max(LIMITS.title),
    label: z.string().trim().max(LIMITS.label).default(""),
    value: z.string().trim().max(LIMITS.value).default(""),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    logo: pngDataUrl.optional(),
    icon: pngDataUrl.optional(),
  })
  .transform((data, ctx) => {
    const result = validateBarcode(data.barcodeFormat, data.barcodeValue)
    if (!result.ok) {
      ctx.addIssue({ code: "custom", path: ["barcodeValue"], message: result.error })
      return z.NEVER
    }
    return { ...data, barcodeValue: result.value }
  })

export type PassRequest = z.output<typeof passRequestSchema>

export function decodePngDataUrl(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64")
}

/** Accepts a PEM either verbatim, with escaped newlines, or base64-encoded. */
export function readPem(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.includes("-----BEGIN")) return value.replace(/\\n/g, "\n")
  return Buffer.from(value, "base64").toString("utf8")
}
