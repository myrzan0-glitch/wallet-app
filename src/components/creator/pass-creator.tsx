"use client"

import { useEffect, useState } from "react"
import { CreditCard, Link2, Wifi } from "lucide-react"
import { toast } from "sonner"

import { AddButtons, HandoffDialog } from "@/components/creator/add-buttons"
import { CardInputs } from "@/components/creator/card-inputs"
import { DesignInputs } from "@/components/creator/design-inputs"
import { PreviewPanel } from "@/components/creator/preview-panel"
import {
  INITIAL_STATE,
  buildDraft,
  decodeState,
  encodeState,
  sampleDraft,
  type ErrorKey,
  type FormState,
  type InputId,
} from "@/components/creator/state"
import { LinkInputs, WifiInputs } from "@/components/creator/template-inputs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toPlatformFormat, type Platform } from "@/lib/barcode/formats"
import { detectDevice, isIosInAppBrowser, type Device } from "@/lib/client/device"
import type { ProcessedLogo } from "@/lib/client/image"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import type { Template } from "@/lib/templates"

const TEMPLATE_ICONS = { card: CreditCard, wifi: Wifi, link: Link2 } satisfies Record<Template, unknown>

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

/** Brings the first invalid field into view and focuses it. */
function focusField(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "center" })
  el.focus({ preventScroll: true })
}

export function PassCreator({ dict }: { dict: Dictionary }) {
  const [state, setState] = useState<FormState>(INITIAL_STATE)
  const [logo, setLogo] = useState<ProcessedLogo>()
  const [device, setDevice] = useState<Device>("ios")
  const [view, setView] = useState<Platform>("apple")
  const [inAppBrowser, setInAppBrowser] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState<Platform | null>(null)
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null)

  useEffect(() => {
    // Runs after hydration: match the device and pick up a form shared from a desktop.
    const ua = navigator.userAgent
    const shared = new URLSearchParams(window.location.hash.slice(1)).get("s")
    const prefill = shared ? decodeState(shared) : null
    if (shared) history.replaceState(null, "", window.location.pathname + window.location.search)
    queueMicrotask(() => {
      const d = detectDevice(ua)
      setDevice(d)
      setView(d === "android" ? "google" : "apple")
      setInAppBrowser(isIosInAppBrowser(ua))
      if (prefill) setState(prefill)
    })
  }, [])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((s) => ({ ...s, [key]: value }))

  const draft = buildDraft(state, dict)
  const title = state.title.trim() || draft.defaultTitle
  const isExample = draft.barcode === undefined && draft.fields.length === 0 && !state.title.trim()
  const sample = sampleDraft(state.template, dict)
  const errorText = (id: InputId) =>
    showErrors && draft.errors[id] ? dict.errors[draft.errors[id] as ErrorKey] : undefined
  const titleError = showErrors && !title ? dict.errors.titleRequired : undefined

  const buildPayload = (platform: Platform) => {
    const barcode = draft.barcode && { ...draft.barcode, format: toPlatformFormat(draft.barcode.format, platform) }
    const base = { barcode, title, fields: draft.fields, color: state.color }
    // Apple shows a wide logo plus a square icon; Google masks its logo to a circle.
    return platform === "apple" ? { ...base, logo: logo?.logo, icon: logo?.icon } : { ...base, logo: logo?.icon }
  }

  const request = async (platform: Platform, payload: object) => {
    const res = await fetch(platform === "apple" ? "/api/passes/apple?validate=1" : "/api/passes/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const code = typeof data.error === "string" && data.error in dict.errors ? data.error : `${platform}_failed`
      toast.error(dict.errors[code as ErrorKey])
      return null
    }
    return data as { saveUrl?: string }
  }

  const create = async (platform: Platform) => {
    const payload = buildPayload(platform)
    setBusy(platform)
    try {
      const data = await request(platform, payload)
      if (!data) return
      if (platform === "apple") {
        submitApplePass(payload)
        toast.success(dict.actions.appleDone)
      } else if (data.saveUrl) {
        window.location.href = data.saveUrl
      }
    } catch {
      toast.error(dict.errors.network)
    } finally {
      setBusy(null)
    }
  }

  const onAdd = (platform: Platform) => {
    setShowErrors(true)
    const firstError = (Object.keys(draft.errors) as InputId[]).find((id) => draft.errors[id])
    if (firstError) return focusField(firstError)
    if (!title) return focusField("title")
    if (draft.barcode === undefined) return

    // A desktop can't add to an iPhone's Wallet, so hand the filled-in form over to the phone.
    if (platform === "apple" && device === "desktop") {
      setHandoffUrl(`${window.location.origin}${window.location.pathname}#s=${encodeState(state)}`)
      return
    }
    create(platform)
  }

  const preview = (
    <PreviewPanel
      view={view}
      onViewChange={setView}
      isExample={isExample}
      title={isExample ? sample.defaultTitle : title}
      fields={isExample ? sample.fields : draft.fields}
      barcode={isExample ? sample.barcode : draft.barcode}
      placeholderFormat={state.template === "card" ? state.card.format : "qr"}
      color={state.color}
      logo={logo?.logo}
      icon={logo?.icon}
      dict={dict}
    />
  )
  const actions = <AddButtons device={device} busy={busy} inAppBrowser={inAppBrowser} onAdd={onAdd} dict={dict} />

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <Card className="gap-0 py-0">
        <CardContent className="flex flex-col gap-8 p-5 sm:p-8">
          <Tabs value={state.template} onValueChange={(t) => update("template", t as Template)} className="gap-8">
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

            <TabsContent value="card">
              <CardInputs
                value={state.card}
                onChange={(v) => update("card", v)}
                error={errorText("barcode")}
                dict={dict}
              />
            </TabsContent>
            <TabsContent value="wifi">
              <WifiInputs
                value={state.wifi}
                onChange={(v) => update("wifi", v)}
                dict={dict}
                errors={{ ssid: errorText("ssid"), password: errorText("wifi-password") }}
              />
            </TabsContent>
            <TabsContent value="link">
              <LinkInputs
                value={state.link}
                onChange={(v) => update("link", v)}
                dict={dict}
                error={errorText("link")}
              />
            </TabsContent>
          </Tabs>

          {/* On phones the preview sits right under the inputs it reflects. */}
          <div className="lg:hidden">{preview}</div>

          <Separator />

          <DesignInputs
            title={state.title}
            titlePlaceholder={draft.defaultTitle || dict.design.titlePlaceholder}
            titleError={titleError}
            onTitleChange={(v) => update("title", v)}
            logo={logo}
            onLogoChange={setLogo}
            color={state.color}
            onColorChange={(v) => update("color", v)}
            dict={dict}
          />

          <div className="lg:hidden">{actions}</div>
        </CardContent>
      </Card>

      {/* On desktop the preview and buttons stay in view while the form scrolls. */}
      <aside className="hidden flex-col gap-6 lg:sticky lg:top-6 lg:flex">
        {preview}
        {actions}
      </aside>

      <HandoffDialog
        url={handoffUrl}
        onClose={() => setHandoffUrl(null)}
        onDownload={() => {
          setHandoffUrl(null)
          create("apple")
        }}
        dict={dict}
      />
    </div>
  )
}
