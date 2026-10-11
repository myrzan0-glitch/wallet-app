import { timingSafeEqual } from "node:crypto"
import { after } from "next/server"
import { z } from "zod"

import { NotConfiguredError, createAppleTicket, createGoogleTicket, ticketSchema } from "@/lib/pass/ticket"
import { recordStat } from "@/lib/stats/store"

const bodySchema = z.object({ platform: z.enum(["apple", "google"]), ticket: ticketSchema })

/** Keys for other apps (izipass) in WALLET_API_KEYS, comma-separated. */
function authorized(request: Request) {
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? ""
  const keys = (process.env.WALLET_API_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean)
  return keys.some((k) => k.length === given.length && timingSafeEqual(Buffer.from(k), Buffer.from(given)))
}

/**
 * Pass service for partner apps: builds an Apple event ticket (.pkpass bytes)
 * or a Google Wallet save link for a ticket the caller describes.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    return Response.json({ error: "invalid_input", issues }, { status: 422 })
  }
  const { platform, ticket } = parsed.data

  try {
    if (platform === "apple") {
      const pkpass = await createAppleTicket(ticket)
      after(() => recordStat("generated", "apple", { template: "ticket" }))
      return new Response(new Uint8Array(pkpass), {
        headers: { "Content-Type": "application/vnd.apple.pkpass", "Cache-Control": "no-store" },
      })
    }
    const saveUrl = await createGoogleTicket(ticket)
    after(() => recordStat("generated", "google", { template: "ticket" }))
    return Response.json({ saveUrl }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof NotConfiguredError) return Response.json({ error: `${platform}_not_configured` }, { status: 503 })
    console.error("ticket failed", platform, (error as Error).message)
    return Response.json({ error: `${platform}_failed` }, { status: 500 })
  }
}
