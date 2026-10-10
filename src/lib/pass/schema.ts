import { z } from "zod"

import { BARCODE_FORMATS, validateBarcode } from "@/lib/barcode/formats"
import { TEMPLATES } from "@/lib/templates"

export const LIMITS = {
  title: 40,
  label: 24,
  value: 64,
  barcode: 512,
  fields: 3,
  /** Max decoded PNG size for logo / icon. */
  imageBytes: 300 * 1024,
} as const

const pngDataUrl = z
  .string()
  .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, "Expected a PNG data URL")
  .refine((s) => (s.length - "data:image/png;base64,".length) * 0.75 <= LIMITS.imageBytes, "Image too large")

const fieldSchema = z.object({
  label: z.string().trim().max(LIMITS.label).default(""),
  value: z.string().trim().min(1).max(LIMITS.value),
})

export const passRequestSchema = z
  .object({
    barcode: z
      .object({ format: z.enum(BARCODE_FORMATS), value: z.string().min(1).max(LIMITS.barcode) })
      .nullish(),
    title: z.string().trim().min(1).max(LIMITS.title),
    fields: z.array(fieldSchema).max(LIMITS.fields).default([]),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    logo: pngDataUrl.optional(),
    icon: pngDataUrl.optional(),
    /** Only used for stats. */
    template: z.enum(TEMPLATES).optional(),
  })
  .transform((data, ctx) => {
    if (!data.barcode) return { ...data, barcode: null }
    const result = validateBarcode(data.barcode.format, data.barcode.value)
    if (!result.ok) {
      ctx.addIssue({ code: "custom", path: ["barcode", "value"], message: result.error })
      return z.NEVER
    }
    return { ...data, barcode: { format: data.barcode.format, value: result.value } }
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
