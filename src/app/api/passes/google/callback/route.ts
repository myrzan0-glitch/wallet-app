import { googleConfig } from "@/lib/pass/config"
import { verifyCallback, type RootKey } from "@/lib/pass/google-callback"
import { templateOf } from "@/lib/stats/keys"
import { recordStat } from "@/lib/stats/store"

const ROOT_KEYS_URL = "https://pay.google.com/gp/m/issuer/keys"

let rootKeys: { keys: RootKey[]; fetchedAt: number } | undefined

async function googleRootKeys() {
  if (!rootKeys || Date.now() - rootKeys.fetchedAt > 3_600_000) {
    const res = await fetch(ROOT_KEYS_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`root keys: ${res.status}`)
    rootKeys = { keys: ((await res.json()) as { keys: RootKey[] }).keys, fetchedAt: Date.now() }
  }
  return rootKeys.keys
}

/** Google Wallet posts here when a pass is saved to or deleted from a wallet. */
export async function POST(request: Request) {
  const config = googleConfig()
  if (!config) return new Response(null, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const message = verifyCallback(body, { recipientId: config.issuerId, rootKeys: await googleRootKeys() })
  if (!message) {
    console.warn("google callback rejected")
    return new Response(null, { status: 400 })
  }

  const event = /^save$/i.test(message.eventType) ? "added" : /^del/i.test(message.eventType) ? "removed" : null
  if (event && message.objectId.startsWith(`${config.issuerId}.`)) {
    await recordStat(event, "google", { template: templateOf(message.objectId), once: message.objectId })
  }
  return new Response(null, { status: 200 })
}
