"use client"

import { useRef } from "react"
import { ImageIcon, X } from "lucide-react"
import { toast } from "sonner"

import { COLORS } from "@/components/creator/state"
import { FormField } from "@/components/creator/template-inputs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { processLogo, type ProcessedLogo } from "@/lib/client/image"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import { LIMITS } from "@/lib/pass/schema"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  titlePlaceholder: string
  titleError?: string
  onTitleChange: (title: string) => void
  logo?: ProcessedLogo
  onLogoChange: (logo?: ProcessedLogo) => void
  color: string
  onColorChange: (color: string) => void
  dict: Dictionary
}

export function DesignInputs(props: Props) {
  const { dict } = props
  const logoInput = useRef<HTMLInputElement>(null)

  const onLogo = async (file: File | undefined) => {
    if (!file) return
    try {
      props.onLogoChange(await processLogo(file))
    } catch {
      toast.error(dict.errors.logoInvalid)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FormField id="title" label={dict.design.titleLabel} error={props.titleError}>
        <Input
          id="title"
          value={props.title}
          maxLength={LIMITS.title}
          placeholder={props.titlePlaceholder}
          aria-invalid={!!props.titleError}
          onChange={(e) => props.onTitleChange(e.target.value)}
        />
      </FormField>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
        <div className="flex flex-col gap-2">
          <Label>
            {dict.design.logoLabel}
            <span className="font-normal text-muted-foreground">{dict.design.optional}</span>
          </Label>
          {props.logo ? (
            <div className="flex items-center gap-2 rounded-md border p-1 pr-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.logo.icon} alt="" className="size-7 rounded object-contain" />
              <Button variant="ghost" size="sm" onClick={() => props.onLogoChange(undefined)}>
                <X />
                {dict.design.removeLogo}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => logoInput.current?.click()}>
              <ImageIcon />
              {dict.design.uploadLogo}
            </Button>
          )}
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              onLogo(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{dict.design.colorLabel}</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={props.color === c}
                onClick={() => props.onColorChange(c)}
                className={cn(
                  "size-7 cursor-pointer rounded-full border shadow-xs outline-offset-2 transition",
                  props.color === c && "outline-2 outline-foreground",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <label
              className={cn(
                "relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] outline-offset-2",
                !COLORS.includes(props.color) && "outline-2 outline-foreground",
              )}
              title={dict.design.customColor}
            >
              <span className="sr-only">{dict.design.customColor}</span>
              <input
                type="color"
                value={props.color}
                onChange={(e) => props.onColorChange(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
