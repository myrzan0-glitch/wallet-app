import type { BarcodeFormat } from "@/lib/barcode/formats"

export const TEMPLATES = ["card", "wifi", "link"] as const
export type Template = (typeof TEMPLATES)[number]

export type PassField = { label: string; value: string }
export type PassBarcode = { format: BarcodeFormat; value: string }

// --- Wi-Fi ------------------------------------------------------------------

export const WIFI_SECURITY = ["WPA", "WEP", "nopass"] as const
export type WifiSecurity = (typeof WIFI_SECURITY)[number]

/** Escapes the characters the WIFI: QR format reserves. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1")
}

/** Builds the payload phone cameras recognise as "join this network". */
export function wifiQr(ssid: string, password: string, security: WifiSecurity): string {
  const pass = security === "nopass" ? "" : `P:${escapeWifi(password)};`
  return `WIFI:T:${security};S:${escapeWifi(ssid)};${pass};`
}

export function checkWifi(
  ssid: string,
  password: string,
  security: WifiSecurity,
): "ssidRequired" | "passwordShort" | undefined {
  if (!ssid.trim()) return "ssidRequired"
  if (security === "WPA" && password.length < 8) return "passwordShort"
  if (security === "WEP" && password.length < 5) return "passwordShort"
  return undefined
}

// --- Link -------------------------------------------------------------------

/**
 * Turns user input into a URL: adds https:// when missing and expands a
 * Telegram handle (@name) to t.me/name. Returns null when it isn't a link.
 */
export function normalizeLink(raw: string): string | null {
  let input = raw.trim()
  if (!input) return null
  if (/^@[A-Za-z0-9_]{4,32}$/.test(input)) input = `https://t.me/${input.slice(1)}`
  if (!/^[a-z][a-z0-9+.-]*:/i.test(input)) input = `https://${input}`
  try {
    const url = new URL(input)
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null
    const href = url.href
    return href.length <= 512 ? href : null
  } catch {
    return null
  }
}

/** Short human-readable form of a link for the front of the pass. */
export function displayLink(url: string, max = 40): string {
  const { hostname, pathname, search } = new URL(url)
  const text = (hostname.replace(/^www\./, "") + (pathname === "/" ? "" : pathname) + search).replace(/\/$/, "")
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
