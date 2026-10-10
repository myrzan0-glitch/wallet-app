import { after } from "next/server"

import { AppleNotConfiguredError, createApplePass } from "@/lib/pass/apple"
import { appleConfig } from "@/lib/pass/config"
import { readPassRequest } from "@/lib/pass/request"
import { recordStat } from "@/lib/stats/store"

export async function POST(request: Request) {
  const input = await readPassRequest(request)
  if (!input.ok) return input.response

  // `?validate=1` lets the browser check input before submitting the real form.
  if (new URL(request.url).searchParams.has("validate")) {
    if (!appleConfig()) return Response.json({ error: "apple_not_configured" }, { status: 503 })
    return Response.json({ ok: true })
  }

  try {
    const pkpass = await createApplePass(input.data)
    after(() => recordStat("generated", "apple", { template: input.data.template }))
    return new Response(new Uint8Array(pkpass), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="pass.pkpass"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AppleNotConfiguredError) {
      return Response.json({ error: "apple_not_configured" }, { status: 503 })
    }
    console.error("apple pass failed", (error as Error).message)
    return Response.json({ error: "apple_failed" }, { status: 500 })
  }
}
