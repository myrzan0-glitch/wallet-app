import { describe, expect, it } from "vitest"

import { INITIAL_STATE, decodeState, encodeState, type FormState } from "@/components/creator/state"

describe("sharing the form with a phone", () => {
  it("round-trips the active template, title and colour", () => {
    const state: FormState = {
      ...INITIAL_STATE,
      template: "wifi",
      wifi: { ssid: "Кафе;WiFi", password: "pa:ss", security: "WPA" },
      title: "Ko‘k choy",
      color: "#16a34a",
    }
    expect(decodeState(encodeState(state))).toEqual(state)
  })

  it("only carries the active template's inputs", () => {
    const state: FormState = {
      ...INITIAL_STATE,
      template: "link",
      link: "@myshop",
      wifi: { ...INITIAL_STATE.wifi, ssid: "Cafe" },
    }
    const decoded = decodeState(encodeState(state))
    expect(decoded?.link).toBe("@myshop")
    expect(decoded?.wifi.ssid).toBe("")
  })

  it("rejects garbage and unknown templates", () => {
    expect(decodeState("not-base64!")).toBeNull()
    expect(decodeState(btoa(JSON.stringify({ template: "evil" })))).toBeNull()
  })
})
