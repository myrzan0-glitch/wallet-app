import { describe, expect, it } from "vitest"

import { checkWifi, displayLink, normalizeLink, wifiQr } from "@/lib/templates"

describe("Wi-Fi", () => {
  it("builds the WIFI: payload and escapes reserved characters", () => {
    expect(wifiQr("Cafe", "secret123", "WPA")).toBe("WIFI:T:WPA;S:Cafe;P:secret123;;")
    expect(wifiQr('My;Net,"x"', "a:b\\c", "WPA")).toBe('WIFI:T:WPA;S:My\\;Net\\,\\"x\\";P:a\\:b\\\\c;;')
  })
  it("omits the password for open networks", () => {
    expect(wifiQr("Guest", "ignored", "nopass")).toBe("WIFI:T:nopass;S:Guest;;")
  })
  it("validates SSID and password length", () => {
    expect(checkWifi(" ", "", "nopass")).toBe("ssidRequired")
    expect(checkWifi("Cafe", "short", "WPA")).toBe("passwordShort")
    expect(checkWifi("Cafe", "", "nopass")).toBeUndefined()
  })
})

describe("Link", () => {
  it("adds https:// and expands Telegram handles", () => {
    expect(normalizeLink("instagram.com/myshop")).toBe("https://instagram.com/myshop")
    expect(normalizeLink("@myrzan_shop")).toBe("https://t.me/myrzan_shop")
  })
  it("rejects things that are not web links", () => {
    expect(normalizeLink("hello")).toBeNull()
    expect(normalizeLink("javascript:alert(1)")).toBeNull()
    expect(normalizeLink("")).toBeNull()
  })
  it("shortens links for display", () => {
    expect(displayLink("https://www.instagram.com/myshop/")).toBe("instagram.com/myshop")
    expect(displayLink("https://example.com/" + "a".repeat(60))).toHaveLength(40)
  })
})
