import { fromDetectorFormat, type BarcodeFormat } from "@/lib/barcode/formats"

export type DetectedCode = { format: BarcodeFormat; value: string }

type Detector = { detect(source: ImageBitmapSource): Promise<{ format: string; rawValue: string }[]> }

let detector: Promise<Detector> | undefined

/** Lazily loads the ZXing-based detector (same engine on every browser). */
export function getDetector(): Promise<Detector> {
  detector ??= import("barcode-detector/ponyfill").then(({ BarcodeDetector, prepareZXingModule }) => {
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith(".wasm") ? `/zxing/${path}` : prefix + path,
      },
    })
    return new BarcodeDetector()
  })
  return detector
}

export async function detectCode(source: ImageBitmapSource): Promise<DetectedCode | null> {
  const results = await (await getDetector()).detect(source)
  const first = results.find((r) => r.rawValue)
  return first ? { format: fromDetectorFormat(first.format), value: first.rawValue } : null
}
