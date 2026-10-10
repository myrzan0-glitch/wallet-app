import { describe, expect, it } from "vitest"

import { lastDays, passId, statDay, statFields, templateOf } from "@/lib/stats/keys"

describe("stats keys", () => {
  it("reads the template back from pass ids", () => {
    expect(templateOf(passId("wifi", "1f2e-33"))).toBe("wifi")
    expect(templateOf(`3388.${passId("link", "ab-cd")}`)).toBe("link")
    // Passes created before templates were tagged.
    expect(templateOf("3388.1f2e3d4c-aaaa")).toBeUndefined()
  })

  it("bumps the platform total and the template", () => {
    expect(statFields("added", "apple", "card")).toEqual(["added:apple", "added:apple:card"])
    expect(statFields("generated", "google")).toEqual(["generated:google"])
  })

  it("uses Tashkent days", () => {
    expect(statDay(new Date("2026-10-10T20:00:00Z"))).toBe("2026-10-11")
    expect(lastDays(2, new Date("2026-10-10T12:00:00Z"))).toEqual(["2026-10-10", "2026-10-09"])
  })
})
