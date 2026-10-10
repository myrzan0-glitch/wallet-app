"use client"

import { useCallback, useRef, useState } from "react"
import { Camera, Loader2, ShieldCheck, Upload } from "lucide-react"
import { toast } from "sonner"

import { CameraScanner } from "@/components/creator/camera-scanner"
import type { CardState } from "@/components/creator/state"
import { FormField } from "@/components/creator/template-inputs"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { FORMAT_LABELS, PLATFORM_FORMATS, guessFormat, type BarcodeFormat } from "@/lib/barcode/formats"
import { detectCode, getDetector, type DetectedCode } from "@/lib/client/detect"
import { flattenImage } from "@/lib/client/image"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import { LIMITS } from "@/lib/pass/schema"

/** Every format either wallet supports; each wallet maps it to one it can show. */
const FORMATS = PLATFORM_FORMATS.google

type Props = {
  value: CardState
  onChange: (next: CardState) => void
  error?: string
  dict: Dictionary
}

export function CardInputs({ value, onChange, error, dict }: Props) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [reading, setReading] = useState(false)
  const [showFormat, setShowFormat] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)

  const onDetected = useCallback(
    (code: DetectedCode) => {
      const format = FORMATS.includes(code.format) ? code.format : "code128"
      onChange({ ...value, barcode: code.value, format, formatTouched: true })
      toast.success(dict.code.detected.replace("{format}", FORMAT_LABELS[code.format]))
    },
    [onChange, value, dict.code.detected],
  )

  const onImage = async (file: File | undefined) => {
    if (!file) return
    setReading(true)
    try {
      const code = await detectCode(await flattenImage(file))
      if (code) onDetected(code)
      else toast.error(dict.code.notFound)
    } catch {
      toast.error(dict.code.notFound)
    } finally {
      setReading(false)
    }
  }

  const onBarcodeChange = (barcode: string) =>
    onChange({ ...value, barcode, format: value.formatTouched ? value.format : guessFormat(barcode) })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            getDetector()
            setScannerOpen(true)
          }}
        >
          <Camera />
          {dict.code.scan}
        </Button>
        <Button variant="outline" size="lg" disabled={reading} onClick={() => imageInput.current?.click()}>
          {reading ? <Loader2 className="animate-spin" /> : <Upload />}
          {reading ? dict.code.reading : dict.code.upload}
        </Button>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onImage(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        {dict.code.processedLocally}
      </p>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs tracking-wider text-muted-foreground uppercase">{dict.code.orManual}</span>
        <Separator className="flex-1" />
      </div>

      <FormField id="barcode" label={dict.code.dataLabel} error={error}>
        <Input
          id="barcode"
          value={value.barcode}
          maxLength={LIMITS.barcode}
          placeholder={dict.code.dataPlaceholder}
          autoComplete="off"
          onChange={(e) => onBarcodeChange(e.target.value)}
        />
      </FormField>

      {showFormat ? (
        <Field>
          <FieldLabel htmlFor="format">{dict.code.formatLabel}</FieldLabel>
          <Select
            value={value.format}
            onValueChange={(f) => onChange({ ...value, format: f as BarcodeFormat, formatTouched: true })}
          >
            <SelectTrigger id="format" className="w-full sm:w-60" aria-describedby="format-hint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription id="format-hint">
            {value.format === "ean13" ? dict.code.ean13Apple : dict.code.formatHint}
          </FieldDescription>
        </Field>
      ) : (
        <p className="-mt-2 text-xs text-muted-foreground">
          {dict.code.formatAuto.replace("{format}", FORMAT_LABELS[value.format])}
          {" · "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => setShowFormat(true)}
          >
            {dict.code.formatChange}
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="label" label={dict.design.labelLabel} optional={dict.design.optional}>
          <Input
            id="label"
            value={value.label}
            maxLength={LIMITS.label}
            placeholder={dict.design.labelPlaceholder}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
          />
        </FormField>
        <FormField id="value" label={dict.design.valueLabel} optional={dict.design.optional}>
          <Input
            id="value"
            value={value.value}
            maxLength={LIMITS.value}
            placeholder={dict.design.valuePlaceholder}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
          />
        </FormField>
      </div>

      <CameraScanner open={scannerOpen} onOpenChange={setScannerOpen} onDetected={onDetected} dict={dict.code} />
    </div>
  )
}
