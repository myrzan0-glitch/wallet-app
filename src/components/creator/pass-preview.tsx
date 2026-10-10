"use client"

import { useEffect, useState } from "react"

import { TWO_D_FORMATS, type BarcodeFormat, type Platform } from "@/lib/barcode/formats"
import { renderBarcodeSvg } from "@/lib/client/render"
import { isDark } from "@/lib/pass/colors"
import { cn } from "@/lib/utils"

type Props = {
  platform: Platform
  title: string
  label: string
  value: string
  color: string
  logo?: string
  icon?: string
  format: BarcodeFormat
  barcode: string
}

function useBarcodeSvg(format: BarcodeFormat, text: string) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    if (!text) {
      Promise.resolve().then(() => !cancelled && setSvg(null))
    } else {
      renderBarcodeSvg(format, text)
        .then((s) => !cancelled && setSvg(s))
        .catch(() => !cancelled && setSvg(null))
    }
    return () => {
      cancelled = true
    }
  }, [format, text])
  return svg
}

/** Approximates how the pass will look in Apple Wallet or Google Wallet. */
export function PassPreview({ platform, title, label, value, color, logo, icon, format, barcode }: Props) {
  const svg = useBarcodeSvg(format, barcode)
  const dark = isDark(color)
  const is2d = TWO_D_FORMATS.includes(format)
  const showAltText = !is2d && barcode.length <= 40

  const barcodeBox = (
    <div className={cn("mx-auto flex flex-col items-center gap-1 rounded-lg bg-white p-3", is2d ? "w-36" : "w-full")}>
      {svg ? (
        <div
          className="w-full [&_svg]:h-auto [&_svg]:w-full"
          // bwip-js output for our own validated input; contains no user markup.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className={cn("w-full rounded bg-neutral-100", is2d ? "aspect-square" : "h-14")} />
      )}
      {showAltText && barcode && <span className="font-mono text-[11px] text-neutral-700">{barcode}</span>}
    </div>
  )

  if (platform === "google") {
    return (
      <div
        className={cn("mx-auto w-full max-w-[340px] overflow-hidden rounded-3xl p-5 shadow-lg", dark ? "text-white" : "text-neutral-900")}
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-3">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="size-9 rounded-full bg-white object-contain" />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">
              {(title || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-medium">{title || "—"}</span>
        </div>
        <div className="my-5 flex flex-col gap-0.5">
          {value && label && <span className="text-xs opacity-75">{label}</span>}
          <span className="truncate text-2xl">{value || title || "—"}</span>
        </div>
        {barcodeBox}
      </div>
    )
  }

  return (
    <div
      className={cn("mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl p-4 shadow-lg", dark ? "text-white" : "text-neutral-900")}
      style={{ backgroundColor: color }}
    >
      <div className="flex h-10 items-center gap-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-8 max-w-[45%] object-contain object-left" />
        ) : null}
        <span className="truncate text-base font-medium">{title || "—"}</span>
      </div>
      <div className="mt-10 mb-6 flex min-h-11 flex-col">
        {value && (
          <>
            <span className="text-[11px] font-semibold uppercase opacity-70">{label}</span>
            <span className="truncate text-xl">{value}</span>
          </>
        )}
      </div>
      {barcodeBox}
    </div>
  )
}
