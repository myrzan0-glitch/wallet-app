import { z } from "zod"

import { passColors } from "@/lib/pass/colors"
import { SITE_HOST } from "@/lib/pass/config-public"
import { passId } from "@/lib/stats/keys"

/**
 * Event tickets issued for another app (izipass) through /api/v1/passes.
 * The caller owns the ticket id; serials are derived from it so the same
 * ticket always maps to the same pass.
 */
export const ticketSchema = z.object({
  /** Caller's stable id (e.g. the registration id). */
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().trim().min(1).max(80),
  organizer: z.string().trim().min(1).max(60),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullish(),
  venue: z.string().trim().max(160).default(""),
  venueUrl: z.string().url().max(300).nullish(),
  attendee: z.string().trim().min(1).max(80),
  reference: z.string().trim().min(1).max(32),
  /** Encoded in the QR code; also the "open ticket" link. */
  url: z.string().url().max(300),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#111111"),
  /** Origins allowed to open the Google save link. */
  origins: z.array(z.string().url()).max(5).default([]),
  locale: z.enum(["uz", "ru", "kk", "en"]).default("en"),
})
export type Ticket = z.output<typeof ticketSchema>

const LABELS = {
  uz: { event: "TADBIR", date: "SANA", venue: "JOY", attendee: "ISHTIROKCHI", reference: "KOD", organizer: "TASHKILOTCHI", open: "Chiptani ochish" },
  ru: { event: "МЕРОПРИЯТИЕ", date: "ДАТА", venue: "МЕСТО", attendee: "УЧАСТНИК", reference: "КОД", organizer: "ОРГАНИЗАТОР", open: "Открыть билет" },
  kk: { event: "ІС-ШАРА", date: "КҮНІ", venue: "ОРНЫ", attendee: "ҚАТЫСУШЫ", reference: "КОД", organizer: "ҰЙЫМДАСТЫРУШЫ", open: "Билетті ашу" },
  en: { event: "EVENT", date: "DATE", venue: "VENUE", attendee: "ATTENDEE", reference: "REFERENCE", organizer: "ORGANIZER", open: "Open ticket" },
}

export const ticketSerial = (id: string) => passId("ticket", id)

/** pass.json for an Apple event ticket; pure so it can be tested. */
export function appleTicketJson(
  ticket: Ticket,
  ids: { teamId: string; passTypeId: string; service?: { url: string; token: string } },
) {
  const l = LABELS[ticket.locale]
  const colors = passColors(ticket.color)
  const ends = ticket.endsAt ? new Date(ticket.endsAt) : new Date(new Date(ticket.startsAt).getTime() + 6 * 3_600_000)
  return {
    formatVersion: 1,
    passTypeIdentifier: ids.passTypeId,
    teamIdentifier: ids.teamId,
    serialNumber: ticketSerial(ticket.id),
    organizationName: ticket.organizer,
    description: ticket.title,
    logoText: ticket.organizer,
    backgroundColor: colors.background,
    foregroundColor: colors.foreground,
    labelColor: colors.label,
    relevantDate: ticket.startsAt,
    // Wallet moves the pass out of the way a day after the event.
    expirationDate: new Date(ends.getTime() + 24 * 3_600_000).toISOString(),
    ...(ids.service ? { webServiceURL: ids.service.url, authenticationToken: ids.service.token } : {}),
    barcodes: [{ format: "PKBarcodeFormatQR", message: ticket.url, messageEncoding: "iso-8859-1", altText: ticket.reference }],
    eventTicket: {
      primaryFields: [{ key: "event", label: l.event, value: ticket.title }],
      secondaryFields: [
        { key: "date", label: l.date, value: ticket.startsAt, dateStyle: "PKDateStyleMedium", timeStyle: "PKDateStyleShort" },
        ...(ticket.venue ? [{ key: "venue", label: l.venue, value: ticket.venue }] : []),
      ],
      auxiliaryFields: [
        { key: "attendee", label: l.attendee, value: ticket.attendee },
        { key: "reference", label: l.reference, value: ticket.reference },
      ],
      backFields: [
        { key: "organizer", label: l.organizer, value: ticket.organizer },
        ...(ticket.venueUrl ? [{ key: "map", label: l.venue, value: ticket.venueUrl }] : []),
        { key: "link", label: l.open, value: ticket.url, attributedValue: `<a href="${ticket.url}">${l.open}</a>` },
        { key: "madeWith", label: "izipass", value: `Powered by ${SITE_HOST}` },
      ],
    },
  }
}

/** Google generic object for the ticket (the approved generic class is reused). */
export function googleTicketObject(ticket: Ticket, issuerId: string, classSuffix: string) {
  const l = LABELS[ticket.locale]
  const text = (value: string) => ({ defaultValue: { language: ticket.locale, value } })
  const date = new Intl.DateTimeFormat(ticket.locale === "uz" ? "uz-Latn-UZ" : ticket.locale, {
    timeZone: "Asia/Tashkent",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(ticket.startsAt))
  return {
    id: `${issuerId}.${ticketSerial(ticket.id)}`,
    classId: `${issuerId}.${classSuffix}`,
    state: "ACTIVE",
    cardTitle: text(ticket.organizer),
    header: text(ticket.title),
    subheader: text(l.event),
    hexBackgroundColor: ticket.color,
    barcode: { type: "QR_CODE", value: ticket.url, alternateText: ticket.reference },
    validTimeInterval: { start: { date: ticket.startsAt }, end: { date: new Date(new Date(ticket.endsAt ?? ticket.startsAt).getTime() + 24 * 3_600_000).toISOString() } },
    textModulesData: [
      { id: "date", header: l.date, body: date },
      ...(ticket.venue ? [{ id: "venue", header: l.venue, body: ticket.venue }] : []),
      { id: "attendee", header: l.attendee, body: ticket.attendee },
      { id: "reference", header: l.reference, body: ticket.reference },
    ],
    linksModuleData: { uris: [{ uri: ticket.url, description: l.open, id: "open" }, ...(ticket.venueUrl ? [{ uri: ticket.venueUrl, description: l.venue, id: "map" }] : [])] },
  }
}

