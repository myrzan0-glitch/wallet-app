import type { BarcodeFormat } from "@/lib/barcode/formats"

const BWIP_IDS: Record<BarcodeFormat, string> = {
  qr: "qrcode",
  code128: "code128",
  ean13: "ean13",
  ean8: "ean8",
  upca: "upca",
  code39: "code39",
  codabar: "rationalizedCodabar",
  itf: "interleaved2of5",
  pdf417: "pdf417",
  aztec: "azteccode",
  datamatrix: "datamatrix",
}

/** Renders a barcode to an SVG string for the preview; throws on invalid data. */
export async function renderBarcodeSvg(format: BarcodeFormat, text: string): Promise<string> {
  const { toSVG } = await import("bwip-js/browser")
  return toSVG({ bcid: BWIP_IDS[format], text, scale: 2, height: 12, includetext: false })
}
