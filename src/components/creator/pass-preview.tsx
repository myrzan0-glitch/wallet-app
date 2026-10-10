"use client"

import { useEffect, useState } from "react"

import { TWO_D_FORMATS, type BarcodeFormat, type Platform } from "@/lib/barcode/formats"
import { renderBarcodeSvg } from "@/lib/client/render"
import { isDark } from "@/lib/pass/colors"
import type { PassBarcode, PassField } from "@/lib/templates"
import { cn } from "@/lib/utils"

type Props = {
  platform: Platform
  title: string
  fields: PassField[]
  color: string
  logo?: string
  icon?: string
  /** `undefined` shows a placeholder; `null` means the pass has no barcode. */
  barcode: PassBarcode | null | undefined
  /** Format to draw the placeholder for while no valid barcode exists yet. */
  placeholderFormat: BarcodeFormat
}

function useBarcodeSvg(barcode: PassBarcode | null | undefined) {
  const [svg, setSvg] = useState<string | null>(null)
  const format = barcode?.format
  const text = barcode?.value
  useEffect(() => {
    let cancelled = false
    if (!format || !text) {
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
export function PassPreview({ platform, title, fields, color, logo, icon, barcode, placeholderFormat }: Props) {
  const svg = useBarcodeSvg(barcode)
  const dark = isDark(color)
  const format = barcode?.format ?? placeholderFormat
  const is2d = TWO_D_FORMATS.includes(format)
  const altText = barcode && !is2d && barcode.value.length <= 40 ? barcode.value : undefined

  const barcodeBox =
    barcode === null ? null : (
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
        {altText && <span className="font-mono text-[11px] text-neutral-700">{altText}</span>}
      </div>
    )

  const cardClass = cn(
    "mx-auto w-full max-w-[340px] overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/15",
    dark ? "text-white" : "text-neutral-900",
  )

  if (platform === "google") {
    const [first, ...rest] = fields
    return (
      <div className={cn(cardClass, "rounded-3xl p-5")} style={{ backgroundColor: color }}>
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
          {first?.label && <span className="text-xs opacity-75">{first.label}</span>}
          <span className="truncate text-2xl">{first?.value || title || "—"}</span>
        </div>
        {rest.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            {rest.map((f, i) => (
              <div key={i} className="flex min-w-0 flex-col">
                <span className="text-xs opacity-75">{f.label}</span>
                <span className="truncate text-sm">{f.value}</span>
              </div>
            ))}
          </div>
        )}
        {barcodeBox}
      </div>
    )
  }

  return (
    <div className={cn(cardClass, "rounded-2xl p-4")} style={{ backgroundColor: color }}>
      <div className="flex h-10 items-center gap-2">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-8 max-w-[45%] object-contain object-left" />
        ) : null}
        <span className="truncate text-base font-medium">{title || "—"}</span>
      </div>
      {fields.length > 1 ? (
        <div className="mt-6 mb-6 flex flex-col gap-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase opacity-70">{fields[0].label}</span>
            <span className="truncate text-2xl">{fields[0].value}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {fields.slice(1).map((f, i) => (
              <div key={i} className="flex min-w-0 flex-col">
                <span className="text-[11px] font-semibold uppercase opacity-70">{f.label}</span>
                <span className="truncate text-base">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 mb-6 flex min-h-11 flex-col">
          {fields[0] && (
            <>
              <span className="text-[11px] font-semibold uppercase opacity-70">{fields[0].label}</span>
              <span className="truncate text-xl">{fields[0].value}</span>
            </>
          )}
        </div>
      )}
      {barcodeBox}
    </div>
  )
}
