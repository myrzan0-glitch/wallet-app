export type Rgb = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function isDark(hex: string): boolean {
  return luminance(hexToRgb(hex)) < 0.4
}

/** Text and label colours that stay readable on the given background. */
export function passColors(background: string) {
  const bg = hexToRgb(background)
  const fg: Rgb = isDark(background) ? [255, 255, 255] : [17, 17, 17]
  // Labels are the foreground blended 35% towards the background.
  const label = fg.map((c, i) => Math.round(c * 0.65 + bg[i] * 0.35)) as Rgb
  const css = (c: Rgb) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`
  return { background: css(bg), foreground: css(fg), label: css(label) }
}
