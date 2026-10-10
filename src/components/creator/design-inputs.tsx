"use client"

import { useRef } from "react"
import { ImageIcon, X } from "lucide-react"
import { toast } from "sonner"

import { COLORS } from "@/components/creator/state"
import { FormField } from "@/components/creator/template-inputs"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
  const isCustomColor = !COLORS.includes(props.color)

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
          onChange={(e) => props.onTitleChange(e.target.value)}
        />
      </FormField>

      <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
        <Field className="w-auto">
          <FieldLabel htmlFor="logo">
            <span>
              {dict.design.logoLabel}
              <span className="font-normal text-muted-foreground"> {dict.design.optional}</span>
            </span>
          </FieldLabel>
          {props.logo ? (
            <div className="flex items-center gap-2 rounded-md border p-1 pr-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.logo.icon} alt="" className="size-7 rounded object-contain" />
              <Button id="logo" variant="ghost" size="sm" onClick={() => props.onLogoChange(undefined)}>
                <X />
                {dict.design.removeLogo}
              </Button>
            </div>
          ) : (
            <Button id="logo" variant="outline" onClick={() => logoInput.current?.click()}>
              <ImageIcon />
              {dict.design.uploadLogo}
            </Button>
          )}
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            tabIndex={-1}
            onChange={(e) => {
              onLogo(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </Field>

        <FieldSet className="w-auto gap-3">
          <FieldLegend variant="label" className="mb-0">
            {dict.design.colorLabel}
          </FieldLegend>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              spacing={2}
              className="flex-wrap"
              value={isCustomColor ? "" : props.color}
              onValueChange={(c) => c && props.onColorChange(c)}
            >
              {COLORS.map((c, i) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  aria-label={dict.design.colorNames[i]}
                  title={dict.design.colorNames[i]}
                  className="size-7 min-w-0 rounded-full border border-foreground/15 p-0 shadow-xs data-[state=on]:ring-2 data-[state=on]:ring-foreground data-[state=on]:ring-offset-2 data-[state=on]:ring-offset-background"
                  style={{ backgroundColor: c }}
                />
              ))}
            </ToggleGroup>
            <label
              title={dict.design.customColor}
              className={cn(
                "relative size-7 cursor-pointer overflow-hidden rounded-full border border-foreground/15 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] focus-within:ring-[3px] focus-within:ring-ring/50",
                isCustomColor && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
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
        </FieldSet>
      </div>
    </div>
  )
}
