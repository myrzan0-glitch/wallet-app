import { describe, expect, it } from "vitest"

import { appleTicketJson, googleTicketObject, ticketSchema, ticketSerial } from "@/lib/pass/ticket-json"

const input = {
  id: "0f3c2a1e-1111-4222-8333-444455556666",
  title: "Разговорный клуб: четверг",
  organizer: "English Speaking Club",
  startsAt: "2026-11-05T14:00:00.000Z",
  venue: "Cafe Bon",
  attendee: "Aziza K.",
  reference: "ENG-8731",
  url: "https://izipass.myrzan.com/t/abc.def",
  locale: "ru" as const,
}

describe("event ticket passes", () => {
  it("validates and fills defaults", () => {
    const ticket = ticketSchema.parse(input)
    expect(ticket.color).toBe("#111111")
    expect(ticket.endsAt).toBeUndefined()
    expect(() => ticketSchema.parse({ ...input, id: "has space" })).toThrow()
    expect(() => ticketSchema.parse({ ...input, startsAt: "tomorrow" })).toThrow()
  })

  it("builds an Apple event ticket with a QR, relevance and expiry", () => {
    const json = appleTicketJson(ticketSchema.parse(input), { teamId: "TEAM", passTypeId: "pass.test", service: { url: "https://w/api", token: "tok" } })
    expect(json.serialNumber).toBe(ticketSerial(input.id))
    expect(json.eventTicket.primaryFields[0].value).toBe(input.title)
    expect(json.eventTicket.secondaryFields[0]).toMatchObject({ dateStyle: "PKDateStyleMedium", value: input.startsAt })
    expect(json.eventTicket.auxiliaryFields.map((f) => f.value)).toEqual(["Aziza K.", "ENG-8731"])
    expect(json.barcodes[0]).toMatchObject({ format: "PKBarcodeFormatQR", message: input.url, altText: "ENG-8731" })
    expect(json.relevantDate).toBe(input.startsAt)
    // no endsAt: 6h event + 24h grace
    expect(json.expirationDate).toBe("2026-11-06T20:00:00.000Z")
    expect(json.authenticationToken).toBe("tok")
    expect(json.eventTicket.secondaryFields[1].label).toBe("МЕСТО")
  })

  it("builds a Google generic object on the approved class", () => {
    const object = googleTicketObject(ticketSchema.parse({ ...input, endsAt: "2026-11-05T16:00:00.000Z" }), "3388", "generic_v1")
    expect(object.id).toBe(`3388.${ticketSerial(input.id)}`)
    expect(object.classId).toBe("3388.generic_v1")
    expect(object.barcode).toMatchObject({ type: "QR_CODE", value: input.url, alternateText: "ENG-8731" })
    expect(object.validTimeInterval.end.date).toBe("2026-11-06T16:00:00.000Z")
    expect(object.textModulesData.find((m) => m.id === "date")?.body).toContain("19:00")
  })
})
