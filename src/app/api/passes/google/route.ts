import { after } from "next/server"

import { GoogleNotConfiguredError, createGoogleSaveUrl } from "@/lib/pass/google"
import { readPassRequest } from "@/lib/pass/request"
import { recordStat } from "@/lib/stats/store"

export async function POST(request: Request) {
  const input = await readPassRequest(request)
  if (!input.ok) return input.response

  try {
    const saveUrl = await createGoogleSaveUrl(input.data)
    after(() => recordStat("generated", "google", { template: input.data.template }))
    return Response.json({ saveUrl }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    if (error instanceof GoogleNotConfiguredError) {
      return Response.json({ error: "google_not_configured" }, { status: 503 })
    }
    // Log only the message: request bodies contain card data.
    console.error("google pass failed", (error as Error).message)
    return Response.json({ error: "google_failed" }, { status: 500 })
  }
}
