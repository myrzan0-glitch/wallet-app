import { timingSafeEqual } from "node:crypto"

import { appleServiceToken } from "@/lib/pass/apple"
import { appleConfig } from "@/lib/pass/config"
import { templateOf } from "@/lib/stats/keys"
import { recordStat } from "@/lib/stats/store"

/**
 * Apple's PassKit web service. Passes are never updated, so this only
 * counts registrations (pass added to a device) and unregistrations.
 */
type Context = RouteContext<"/api/passes/apple/service/v1/[...path]">

/** `devices/{device}/registrations/{passTypeId}/{serial}` */
async function registration(request: Request, { params }: Context) {
  const config = appleConfig()
  const { path } = await params
  if (!config || path.length !== 5 || path[0] !== "devices" || path[2] !== "registrations") return null
  const [, device, , passTypeId, serial] = path
  if (passTypeId !== config.passTypeId) return null

  const header = request.headers.get("authorization") ?? ""
  const given = Buffer.from(header.replace(/^ApplePass /, ""))
  const expected = Buffer.from(appleServiceToken(serial, config.signerKey))
  const authorized = given.length === expected.length && timingSafeEqual(given, expected)
  return { device, serial, authorized }
}

export async function POST(request: Request, context: Context) {
  const { path } = await context.params
  if (path.join("/") === "log") return new Response(null, { status: 200 })

  const reg = await registration(request, context)
  if (!reg) return new Response(null, { status: 404 })
  if (!reg.authorized) return new Response(null, { status: 401 })
  const fresh = await recordStat("added", "apple", { template: templateOf(reg.serial), once: reg.serial, device: reg.device })
  return new Response(null, { status: fresh ? 201 : 200 })
}

export async function DELETE(request: Request, context: Context) {
  const reg = await registration(request, context)
  if (!reg) return new Response(null, { status: 404 })
  if (!reg.authorized) return new Response(null, { status: 401 })
  await recordStat("removed", "apple", { template: templateOf(reg.serial), once: reg.serial })
  return new Response(null, { status: 200 })
}

/** Update checks: there are never updated passes. */
export async function GET() {
  return new Response(null, { status: 204 })
}
