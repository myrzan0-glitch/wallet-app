import "server-only"

import { passRequestSchema } from "@/lib/pass/schema"

/**
 * Reads a pass request from either a JSON body or a form post whose
 * `payload` field holds the JSON (used so iOS Safari can open the .pkpass).
 */
export async function readPassRequest(request: Request) {
  let body: unknown
  try {
    const type = request.headers.get("content-type") ?? ""
    if (type.includes("application/json")) {
      body = await request.json()
    } else {
      const form = await request.formData()
      body = JSON.parse(String(form.get("payload") ?? "null"))
    }
  } catch {
    return { ok: false as const, response: Response.json({ error: "invalid_body" }, { status: 400 }) }
  }
  const parsed = passRequestSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    return { ok: false as const, response: Response.json({ error: "invalid_input", issues }, { status: 422 }) }
  }
  return { ok: true as const, data: parsed.data }
}
