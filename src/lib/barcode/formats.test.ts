import { describe, expect, it } from "vitest"

import { guessFormat, toPlatformFormat, validateBarcode } from "@/lib/barcode/formats"

describe("validateBarcode", () => {
  it("appends a missing EAN-13 check digit and rejects a wrong one", () => {
    expect(validateBarcode("ean13", "478000012345")).toEqual({ ok: true, value: "4780000123454" })
    expect(validateBarcode("ean13", "4780000123450")).toEqual({ ok: false, error: "checksum" })
  })
  it("limits Code 128 to printable ASCII", () => {
    expect(validateBarcode("code128", "ABC-123").ok).toBe(true)
    expect(validateBarcode("code128", "Привет")).toEqual({ ok: false, error: "charset" })
  })
})

describe("format helpers", () => {
  it("maps formats a wallet can't show to one it can", () => {
    expect(toPlatformFormat("ean8", "apple")).toBe("code128")
    expect(toPlatformFormat("datamatrix", "apple")).toBe("qr")
    expect(toPlatformFormat("ean8", "google")).toBe("ean8")
  })
  it("guesses a format from typed input", () => {
    expect(guessFormat("4780000123454")).toBe("ean13")
    expect(guessFormat("CARD-001")).toBe("code128")
    expect(guessFormat("https://t.me/x")).toBe("qr")
  })
})
