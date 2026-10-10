"use client"

import { AppleIcon, GoogleIcon } from "@/components/creator/brand-icons"
import { PassPreview } from "@/components/creator/pass-preview"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toPlatformFormat, type BarcodeFormat, type Platform } from "@/lib/barcode/formats"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import type { PassBarcode, PassField } from "@/lib/templates"
import { cn } from "@/lib/utils"

type Props = {
  view: Platform
  onViewChange: (view: Platform) => void
  isExample: boolean
  title: string
  fields: PassField[]
  barcode: PassBarcode | null | undefined
  placeholderFormat: BarcodeFormat
  color: string
  logo?: string
  icon?: string
  dict: Dictionary
}

export function PreviewPanel({ view, onViewChange, isExample, barcode, placeholderFormat, dict, ...pass }: Props) {
  // Show the barcode the chosen wallet will actually display (e.g. EAN-8 becomes Code 128 on iPhone).
  const shown = barcode ? { ...barcode, format: toPlatformFormat(barcode.format, view) } : barcode
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{dict.preview.heading}</h2>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view}
          onValueChange={(v) => v && onViewChange(v as Platform)}
        >
          <ToggleGroupItem value="apple" aria-label={dict.tabs.apple}>
            <AppleIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="google" aria-label={dict.tabs.google}>
            <GoogleIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className={cn("transition-opacity", isExample && "opacity-50")}>
        <PassPreview
          platform={view}
          barcode={shown}
          placeholderFormat={toPlatformFormat(placeholderFormat, view)}
          {...pass}
        />
      </div>
      {isExample && <p className="text-center text-xs text-muted-foreground">{dict.preview.example}</p>}
    </div>
  )
}
