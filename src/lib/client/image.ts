/** Draws an image into a PNG that fits within the given box. */
function toPng(image: ImageBitmap, maxWidth: number, maxHeight: number, square = false): string {
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height)
  const w = Math.round(image.width * scale)
  const h = Math.round(image.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = square ? Math.max(w, h) : w
  canvas.height = square ? Math.max(w, h) : h
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  return canvas.toDataURL("image/png")
}

export type ProcessedLogo = {
  /** Apple logo: fits Apple's 160×50pt box at @3x. */
  logo: string
  /** Square image used for the Apple icon and the Google logo. */
  icon: string
}

/** Re-encodes an uploaded logo in the browser; strips metadata such as EXIF. */
export async function processLogo(file: File): Promise<ProcessedLogo> {
  const image = await createImageBitmap(file)
  try {
    return { logo: toPng(image, 480, 150), icon: toPng(image, 180, 180, true) }
  } finally {
    image.close()
  }
}

/**
 * Prepares a photo or screenshot for barcode detection: draws it on white
 * (transparent PNGs would otherwise read as black) and caps its size.
 */
export async function flattenImage(file: File, maxSide = 2000): Promise<ImageData> {
  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  } finally {
    image.close()
  }
}
