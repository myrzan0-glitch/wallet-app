import "server-only"

import { PKPass } from "passkit-generator"

import { hexToRgb } from "@/lib/pass/colors"
import { APPLE_SERVICE_URL, appleServiceToken } from "@/lib/pass/apple"
import { appleConfig, googleConfig } from "@/lib/pass/config"
import { GOOGLE_API, apiClient, ensureClass, saveUrl } from "@/lib/pass/google"
import { solidPng } from "@/lib/pass/png"
import { appleTicketJson, googleTicketObject, ticketSerial, type Ticket } from "@/lib/pass/ticket-json"

export { ticketSchema, type Ticket } from "@/lib/pass/ticket-json"

export class NotConfiguredError extends Error {}

export async function createAppleTicket(ticket: Ticket): Promise<Buffer> {
  const config = appleConfig()
  if (!config) throw new NotConfiguredError("apple")
  const serial = ticketSerial(ticket.id)
  const json = appleTicketJson(ticket, {
    teamId: config.teamId,
    passTypeId: config.passTypeId,
    service: APPLE_SERVICE_URL.startsWith("https://") ? { url: APPLE_SERVICE_URL, token: appleServiceToken(serial, config.signerKey) } : undefined,
  })
  const icon = solidPng(87, hexToRgb(ticket.color))
  const pass = new PKPass(
    { "pass.json": Buffer.from(JSON.stringify(json)), "icon.png": icon, "icon@2x.png": icon, "icon@3x.png": icon },
    { wwdr: config.wwdr, signerCert: config.signerCert, signerKey: config.signerKey, signerKeyPassphrase: config.signerKeyPassphrase },
  )
  return pass.getAsBuffer()
}

export async function createGoogleTicket(ticket: Ticket): Promise<string> {
  const config = googleConfig()
  if (!config) throw new NotConfiguredError("google")
  await ensureClass(config)
  const object = googleTicketObject(ticket, config.issuerId, config.classSuffix)
  const api = apiClient(config)
  // Re-issuing the same ticket updates the existing object instead of failing.
  try {
    await api.request({ url: `${GOOGLE_API}/genericObject`, method: "POST", data: object })
  } catch (error) {
    if ((error as { status?: number }).status !== 409) throw error
    await api.request({ url: `${GOOGLE_API}/genericObject/${object.id}`, method: "PUT", data: object })
  }
  return saveUrl(config, object.id, ticket.origins.length ? ticket.origins : undefined)
}
