import type { Platform } from "@/lib/barcode/formats"
import { TEMPLATES, type Template } from "@/lib/templates"

export type StatEvent = "generated" | "added" | "removed"

/**
 * Serial numbers and Google object ids start with the template, so a save
 * callback can be attributed to a template without storing anything per pass.
 */
export function passId(template: Template | undefined, uuid: string) {
  return template ? `${template}-${uuid}` : uuid
}

export function templateOf(id: string): Template | undefined {
  const prefix = id.slice(id.lastIndexOf(".") + 1).split("-")[0]
  return TEMPLATES.find((t) => t === prefix)
}

/** Hash fields bumped for an event, e.g. `added:apple` and `added:apple:wifi`. */
export function statFields(event: StatEvent, platform: Platform, template?: Template) {
  const field = `${event}:${platform}`
  return template ? [field, `${field}:${template}`] : [field]
}

/** Calendar day in Tashkent, where most users are. */
export function statDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(date)
}

export function lastDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, i) => statDay(new Date(now.getTime() - i * 86_400_000)))
}
