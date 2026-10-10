"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Camera,
  CreditCard,
  IdCard,
  ImageIcon,
  Link2,
  Loader2,
  QrCode,
  ShieldCheck,
  Upload,
  Wifi,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { CameraScanner } from "@/components/creator/camera-scanner"
import { AppleIcon, GoogleIcon } from "@/components/creator/brand-icons"
import { PassPreview } from "@/components/creator/pass-preview"
import {
  LinkInputs,
  PinflInputs,
  WifiInputs,
  type PinflState,
  type WifiState,
} from "@/components/creator/template-inputs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FORMAT_LABELS,
  PLATFORM_FORMATS,
  guessFormat,
  toPlatformFormat,
  validateBarcode,
  type BarcodeFormat,
  type Platform,
} from "@/lib/barcode/formats"
import { detectCode, getDetector, type DetectedCode } from "@/lib/client/detect"
import { flattenImage, processLogo, type ProcessedLogo } from "@/lib/client/image"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import { LIMITS } from "@/lib/pass/schema"
import {
  checkPassport,
  checkPinfl,
  checkStir,
  checkWifi,
  displayLink,
  normalizeLink,
  wifiQr,
  type PassBarcode,
  type PassField,
  type Template,
} from "@/lib/templates"
import { cn } from "@/lib/utils"

const COLORS = ["#111111", "#1e3a8a", "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#9333ea", "#f4f4f5"]

type ErrorKey = keyof Dictionary["errors"]

function isIosInAppBrowser(ua: string) {
  return /iPhone|iPad|iPod/.test(ua) && /Instagram|FBAN|FBAV|Line\/|LinkedInApp|Twitter|TikTok|musical_ly/.test(ua)
}

/** Submits a real form so iOS Safari can hand the .pkpass to Wallet. */
function submitApplePass(payload: object) {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = "/api/passes/apple"
  const input = document.createElement("input")
  input.type = "hidden"
  input.name = "payload"
  input.value = JSON.stringify(payload)
  form.append(input)
  document.body.append(form)
  form.submit()
  form.remove()
}

const TEMPLATE_ICONS = { card: CreditCard, pinfl: IdCard, wifi: Wifi, link: Link2 } satisfies Record<Template, unknown>

type Draft = {
  /** `null`: the pass has no barcode; `undefined`: the input is not valid yet. */
  barcode: PassBarcode | null | undefined
  fields: PassField[]
  defaultTitle: string
  backNote?: string
  errors: Partial<Record<"barcode" | "pinfl" | "passport" | "stir" | "ssid" | "password" | "link", ErrorKey>>
}

export function PassCreator({ dict }: { dict: Dictionary }) {
  const [platform, setPlatform] = useState<Platform>("apple")
  const [template, setTemplate] = useState<Template>("card")
  const [pinfl, setPinfl] = useState<PinflState>({ pinfl: "", passport: "", stir: "", barcode: false })
  const [wifi, setWifi] = useState<WifiState>({ ssid: "", password: "", security: "WPA" })
  const [link, setLink] = useState("")
  const [barcode, setBarcode] = useState("")
  const [format, setFormat] = useState<BarcodeFormat>("qr")
  const [formatTouched, setFormatTouched] = useState(false)
  const [title, setTitle] = useState("")
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [logo, setLogo] = useState<ProcessedLogo>()
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Default to the wallet that matches the device; runs after hydration.
    const ua = navigator.userAgent
    queueMicrotask(() => {
      if (/Android/i.test(ua)) setPlatform("google")
      setInAppBrowser(isIosInAppBrowser(ua))
    })
  }, [])

  const draft = buildDraft()
  const effectiveTitle = title.trim() || draft.defaultTitle
  const errorText = (key: keyof Draft["errors"]) =>
    showErrors && draft.errors[key] ? dict.errors[draft.errors[key]] : undefined
  const titleError = showErrors && !effectiveTitle ? dict.errors.titleRequired : undefined

  function buildDraft(): Draft {
    switch (template) {
      case "card": {
        const check = validateBarcode(format, barcode)
        return {
          barcode: check.ok ? { format, value: check.value } : undefined,
          fields: value.trim() ? [{ label: label.trim(), value: value.trim() }] : [],
          defaultTitle: "",
          errors: check.ok ? {} : { barcode: check.error },
        }
      }
      case "pinfl": {
        const p = checkPinfl(pinfl.pinfl)
        const passport = checkPassport(pinfl.passport)
        const stir = checkStir(pinfl.stir)
        const fields = [
          ...(p.value ? [{ label: dict.pinfl.fieldPinfl, value: p.value }] : []),
          ...(passport.value ? [{ label: dict.pinfl.fieldPassport, value: passport.value }] : []),
          ...(stir.value ? [{ label: dict.pinfl.fieldStir, value: stir.value }] : []),
        ]
        return {
          barcode: !pinfl.barcode ? null : p.error ? undefined : { format: "code128", value: p.value },
          fields,
          defaultTitle: dict.pinfl.defaultTitle,
          backNote: dict.pinfl.note,
          errors: { pinfl: p.error, passport: passport.error, stir: stir.error },
        }
      }
      case "wifi": {
        const error = checkWifi(wifi.ssid, wifi.password, wifi.security)
        const hasPassword = wifi.security !== "nopass" && wifi.password
        return {
          barcode: wifi.ssid.trim()
            ? { format: "qr", value: wifiQr(wifi.ssid, wifi.password, wifi.security) }
            : undefined,
          fields: [
            ...(wifi.ssid.trim() ? [{ label: dict.wifi.fieldNetwork, value: wifi.ssid }] : []),
            ...(hasPassword ? [{ label: dict.wifi.fieldPassword, value: wifi.password }] : []),
          ],
          defaultTitle: dict.wifi.defaultTitle,
          errors: error === "ssidRequired" ? { ssid: error } : error ? { password: error } : {},
        }
      }
      case "link": {
        const url = normalizeLink(link)
        return {
          barcode: url ? { format: "qr", value: url } : undefined,
          fields: url ? [{ label: dict.link.fieldLink, value: displayLink(url) }] : [],
          defaultTitle: url ? new URL(url).hostname.replace(/^www\./, "") : "",
          errors: url ? {} : { link: "linkInvalid" },
        }
      }
    }
  }

  const changePlatform = (next: Platform) => {
    const p = next
    setPlatform(p)
    setFormat((f) => toPlatformFormat(f, p))
  }

  const applyDetected = useCallback(
    (code: DetectedCode) => {
      setBarcode(code.value)
      setFormat(toPlatformFormat(code.format, platform))
      setFormatTouched(true)
      toast.success(dict.code.detected.replace("{format}", FORMAT_LABELS[code.format]))
    },
    [platform, dict.code.detected],
  )

  const onBarcodeChange = (next: string) => {
    setBarcode(next)
    if (!formatTouched) setFormat(toPlatformFormat(guessFormat(next), platform))
  }

  const onImage = async (file: File | undefined) => {
    if (!file) return
    try {
      const code = await detectCode(await flattenImage(file))
      if (code) applyDetected(code)
      else toast.error(dict.code.notFound)
    } catch {
      toast.error(dict.code.notFound)
    }
  }

  const onLogo = async (file: File | undefined) => {
    if (!file) return
    try {
      setLogo(await processLogo(file))
    } catch {
      toast.error(dict.errors.logoInvalid)
    }
  }

  const showError = (code: string | undefined) => {
    const key = (code && code in dict.errors ? code : `${platform}_failed`) as ErrorKey
    toast.error(dict.errors[key])
  }

  const onSubmit = async () => {
    setShowErrors(true)
    const hasErrors = Object.values(draft.errors).some(Boolean)
    if (hasErrors || draft.barcode === undefined || !effectiveTitle) return

    const base = {
      barcode: draft.barcode,
      title: effectiveTitle,
      fields: draft.fields,
      backNote: draft.backNote,
      color,
    }
    // Apple shows a wide logo plus a square icon; Google masks its logo to a circle.
    const payload =
      platform === "apple" ? { ...base, logo: logo?.logo, icon: logo?.icon } : { ...base, logo: logo?.icon }

    setBusy(true)
    try {
      const res = await fetch(platform === "apple" ? "/api/passes/apple?validate=1" : "/api/passes/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return showError(data.error)
      if (platform === "apple") submitApplePass(payload)
      else window.location.href = data.saveUrl
    } catch {
      toast.error(dict.errors.network)
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success(dict.inApp.copied)
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-8 p-5 sm:p-8">
        <Tabs value={platform} onValueChange={changePlatform}>
          <TabsList className="w-full group-data-horizontal/tabs:h-10">
            {(["apple", "google"] as const).map((p) => (
              <TabsTrigger key={p} value={p}>
                {p === "apple" ? <AppleIcon /> : <GoogleIcon />}
                {dict.tabs[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs value={template} onValueChange={(t: Template) => setTemplate(t)}>
          <TabsList variant="line" className="w-full">
            {(Object.keys(TEMPLATE_ICONS) as Template[]).map((t) => {
              const Icon = TEMPLATE_ICONS[t]
              return (
                <TabsTrigger key={t} value={t} className="px-1 max-sm:[&_svg]:hidden">
                  <Icon />
                  {dict.templates[t]}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {template === "pinfl" && (
          <PinflInputs
            value={pinfl}
            onChange={setPinfl}
            dict={dict}
            errors={{ pinfl: errorText("pinfl"), passport: errorText("passport"), stir: errorText("stir") }}
          />
        )}
        {template === "wifi" && (
          <WifiInputs
            value={wifi}
            onChange={setWifi}
            dict={dict}
            errors={{ ssid: errorText("ssid"), password: errorText("password") }}
          />
        )}
        {template === "link" && <LinkInputs value={link} onChange={setLink} dict={dict} error={errorText("link")} />}

        {/* Code input */}
        {template === "card" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">{dict.code.heading}</h2>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                {dict.code.processedLocally}
              </span>
            </div>
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
              <Button variant="outline" size="lg" onClick={() => imageInput.current?.click()}>
                <Upload />
                {dict.code.upload}
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

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                {dict.code.orManual}
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="barcode">{dict.code.dataLabel}</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  maxLength={LIMITS.barcode}
                  placeholder={dict.code.dataPlaceholder}
                  autoComplete="off"
                  aria-invalid={!!errorText("barcode")}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="format">{dict.code.formatLabel}</Label>
                <Select
                  value={format}
                  onValueChange={(f) => {
                    setFormat(f as BarcodeFormat)
                    setFormatTouched(true)
                  }}
                >
                  <SelectTrigger id="format" className="w-full justify-start [&>svg:last-child]:ml-auto">
                    <QrCode className="text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_FORMATS[platform].map((f) => (
                      <SelectItem key={f} value={f}>
                        {FORMAT_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className={cn("font-mono text-xs", errorText("barcode") ? "text-destructive" : "text-muted-foreground")}>
              {errorText("barcode") ??
                (platform === "apple" && format === "ean13" ? dict.code.ean13Apple : dict.code.formatHint)}
            </p>
          </div>
        )}

        <Separator />

        {/* Design */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{dict.design.titleLabel}</Label>
            <Input
              id="title"
              value={title}
              maxLength={LIMITS.title}
              placeholder={draft.defaultTitle || dict.design.titlePlaceholder}
              aria-invalid={!!titleError}
              onChange={(e) => setTitle(e.target.value)}
            />
            {titleError && <p className="font-mono text-xs text-destructive">{titleError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>
              {dict.design.logoLabel}
              <span className="font-normal text-muted-foreground">{dict.design.optional}</span>
            </Label>
            <div className="flex items-center gap-3">
              {logo ? (
                <div className="flex items-center gap-2 rounded-md border p-1.5 pr-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.icon} alt="" className="size-8 rounded object-contain" />
                  <Button variant="ghost" size="sm" onClick={() => setLogo(undefined)}>
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
            <p className="font-mono text-xs text-muted-foreground">{dict.design.logoHint}</p>
          </div>

          {template === "card" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="label">
                  {dict.design.labelLabel}
                  <span className="font-normal text-muted-foreground">{dict.design.optional}</span>
                </Label>
                <Input
                  id="label"
                  value={label}
                  maxLength={LIMITS.label}
                  placeholder={dict.design.labelPlaceholder}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="value">
                  {dict.design.valueLabel}
                  <span className="font-normal text-muted-foreground">{dict.design.optional}</span>
                </Label>
                <Input
                  id="value"
                  value={value}
                  maxLength={LIMITS.value}
                  placeholder={dict.design.valuePlaceholder}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{dict.design.colorLabel}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 cursor-pointer rounded-full border shadow-xs sm:size-8 outline-offset-2 transition",
                    color === c && "outline-2 outline-foreground",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label
                className={cn(
                  "relative flex size-7 cursor-pointer sm:size-8 items-center justify-center overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] outline-offset-2",
                  !COLORS.includes(color) && "outline-2 outline-foreground",
                )}
                title={dict.design.customColor}
              >
                <span className="sr-only">{dict.design.customColor}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview + action */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-medium">{dict.preview.heading}</h2>
          <PassPreview
            platform={platform}
            title={effectiveTitle}
            fields={draft.fields}
            color={color}
            logo={logo?.logo}
            icon={logo?.icon}
            barcode={draft.barcode}
            placeholderFormat={template === "card" ? format : template === "pinfl" ? "code128" : "qr"}
          />

          {platform === "apple" && inAppBrowser && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
              <span>{dict.inApp.body}</span>
              <Button variant="outline" size="sm" onClick={copyLink}>
                {dict.inApp.copy}
              </Button>
            </div>
          )}

          <Button size="lg" className="h-12 text-base" disabled={busy} onClick={onSubmit}>
            {busy ? (
              <Loader2 className="animate-spin" />
            ) : platform === "apple" ? (
              <AppleIcon className="size-5" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            {busy ? dict.actions.working : platform === "apple" ? dict.actions.addApple : dict.actions.addGoogle}
          </Button>
        </div>
      </div>

      <CameraScanner open={scannerOpen} onOpenChange={setScannerOpen} onDetected={applyDetected} dict={dict.code} />
    </section>
  )
}
