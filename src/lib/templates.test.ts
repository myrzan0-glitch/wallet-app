import { describe, expect, it } from "vitest"

import { checkPassport, checkPinfl, checkStir, checkWifi, displayLink, normalizeLink, wifiQr } from "@/lib/templates"

describe("PINFL / documents", () => {
  it("accepts 14 digits and ignores spaces", () => {
    expect(checkPinfl("3120 5901 2345 67")).toEqual({ value: "31205901234567" })
  })
  it("rejects other lengths and letters", () => {
    expect(checkPinfl("1234567890123").error).toBe("pinflFormat")
    expect(checkPinfl("3120590123456A").error).toBe("pinflFormat")
  })
  it("normalises passport and treats empty optional fields as valid", () => {
    expect(checkPassport(" aa 1234567 ")).toEqual({ value: "AA1234567" })
    expect(checkPassport("").error).toBeUndefined()
    expect(checkPassport("A1234567").error).toBe("passportFormat")
    expect(checkStir("").error).toBeUndefined()
    expect(checkStir("12345678").error).toBe("stirFormat")
  })
})

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
