import type { PinflState, WifiState } from "@/components/creator/template-inputs"
import { PLATFORM_FORMATS, validateBarcode, type BarcodeFormat } from "@/lib/barcode/formats"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import {
  TEMPLATES,
  checkPassport,
  checkPinfl,
  checkStir,
  checkWifi,
  displayLink,
  normalizeLink,
  wifiQr,
  type PassBarcode,
  type PassField,
  type Template,
} from "@/lib/templates"

export const COLORS = ["#111111", "#1e3a8a", "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#9333ea", "#f4f4f5"]

export type CardState = { barcode: string; format: BarcodeFormat; formatTouched: boolean; label: string; value: string }

export type FormState = {
  template: Template
  card: CardState
  pinfl: PinflState
  wifi: WifiState
  link: string
  title: string
  color: string
}

export const INITIAL_STATE: FormState = {
  template: "card",
  card: { barcode: "", format: "qr", formatTouched: false, label: "", value: "" },
  pinfl: { pinfl: "", passport: "", stir: "", barcode: false },
  wifi: { ssid: "", password: "", security: "WPA" },
  link: "",
  title: "",
  color: COLORS[0],
}

export type ErrorKey = keyof Dictionary["errors"]
export type InputId = "barcode" | "pinfl" | "passport" | "stir" | "ssid" | "wifi-password" | "link" | "title"

export type Draft = {
  /** `null`: the pass has no barcode; `undefined`: the input is not valid yet. */
  barcode: PassBarcode | null | undefined
  fields: PassField[]
  defaultTitle: string
  backNote?: string
  /** Keyed by the id of the input the error belongs to, in form order. */
  errors: Partial<Record<InputId, ErrorKey>>
}

export function buildDraft(state: FormState, dict: Dictionary): Draft {
  switch (state.template) {
    case "card": {
      const { barcode, format, label, value } = state.card
      const check = validateBarcode(format, barcode)
      return {
        barcode: check.ok ? { format, value: check.value } : undefined,
        fields: value.trim() ? [{ label: label.trim(), value: value.trim() }] : [],
        defaultTitle: "",
        errors: check.ok ? {} : { barcode: check.error },
      }
    }
    case "pinfl": {
      const p = checkPinfl(state.pinfl.pinfl)
      const passport = checkPassport(state.pinfl.passport)
      const stir = checkStir(state.pinfl.stir)
      return {
        barcode: !state.pinfl.barcode ? null : p.error ? undefined : { format: "code128", value: p.value },
        fields: [
          ...(p.value ? [{ label: dict.pinfl.fieldPinfl, value: p.value }] : []),
          ...(passport.value ? [{ label: dict.pinfl.fieldPassport, value: passport.value }] : []),
          ...(stir.value ? [{ label: dict.pinfl.fieldStir, value: stir.value }] : []),
        ],
        defaultTitle: dict.pinfl.defaultTitle,
        backNote: dict.pinfl.note,
        errors: { pinfl: p.error, passport: passport.error, stir: stir.error },
      }
    }
    case "wifi": {
      const { ssid, password, security } = state.wifi
      const error = checkWifi(ssid, password, security)
      return {
        barcode: ssid.trim() ? { format: "qr", value: wifiQr(ssid, password, security) } : undefined,
        fields: [
          ...(ssid.trim() ? [{ label: dict.wifi.fieldNetwork, value: ssid }] : []),
          ...(security !== "nopass" && password ? [{ label: dict.wifi.fieldPassword, value: password }] : []),
        ],
        defaultTitle: dict.wifi.defaultTitle,
        errors: error === "ssidRequired" ? { ssid: error } : error ? { "wifi-password": error } : {},
      }
    }
    case "link": {
      const url = normalizeLink(state.link)
      return {
        barcode: url ? { format: "qr", value: url } : undefined,
        fields: url ? [{ label: dict.link.fieldLink, value: displayLink(url) }] : [],
        defaultTitle: url ? new URL(url).hostname.replace(/^www\./, "") : "",
        errors: url ? {} : { link: "linkInvalid" },
      }
    }
  }
}

/** Example content shown in the preview before the user has entered anything. */
export function sampleDraft(template: Template, dict: Dictionary): Pick<Draft, "barcode" | "fields" | "defaultTitle"> {
  switch (template) {
    case "card":
      return { barcode: { format: "ean13", value: "4780000123454" }, fields: [], defaultTitle: "Korzinka" }
    case "pinfl":
      return {
        barcode: null,
        fields: [{ label: dict.pinfl.fieldPinfl, value: "31205901234567" }],
        defaultTitle: dict.pinfl.defaultTitle,
      }
    case "wifi":
      return {
        barcode: { format: "qr", value: "WIFI:T:WPA;S:Cafe_WiFi;P:example123;;" },
        fields: [
          { label: dict.wifi.fieldNetwork, value: "Cafe_WiFi" },
          { label: dict.wifi.fieldPassword, value: "••••••••" },
        ],
        defaultTitle: dict.wifi.defaultTitle,
      }
    case "link":
      return {
        barcode: { format: "qr", value: "https://instagram.com/yourshop" },
        fields: [{ label: dict.link.fieldLink, value: "instagram.com/yourshop" }],
        defaultTitle: "instagram.com",
      }
  }
}

// --- Sharing the form with a phone (desktop "open on your iPhone") ----------

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

/** Encodes only the active template's inputs; the logo is too large for a URL. */
export function encodeState(state: FormState): string {
  const { template, title, color } = state
  const data = { template, title, color, [template]: state[template] }
  return toBase64Url(JSON.stringify(data))
}

export function decodeState(encoded: string): FormState | null {
  try {
    const data = JSON.parse(fromBase64Url(encoded))
    if (!TEMPLATES.includes(data.template)) return null
    const next: FormState = { ...INITIAL_STATE, title: String(data.title ?? ""), template: data.template }
    if (/^#[0-9a-f]{6}$/i.test(data.color)) next.color = data.color
    const part = data[data.template]
    if (data.template === "link" && typeof part === "string") next.link = part
    else if (part && typeof part === "object") {
      const base = INITIAL_STATE[data.template as Exclude<Template, "link">]
      const merged = Object.fromEntries(
        Object.entries(base).map(([k, v]) => [k, typeof part[k] === typeof v ? part[k] : v]),
      )
      Object.assign(next, { [data.template]: merged })
      if (data.template === "card" && !PLATFORM_FORMATS.google.includes(next.card.format)) next.card.format = "qr"
    }
    return next
  } catch {
    return null
  }
}
