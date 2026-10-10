"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import { WIFI_SECURITY, type WifiSecurity } from "@/lib/templates"

export function FormField({
  id,
  label,
  optional,
  error,
  hint,
  children,
}: {
  id?: string
  label: ReactNode
  optional?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">{optional}</span>}
      </Label>
      {children}
      {(error || hint) && (
        <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{error ?? hint}</p>
      )}
    </div>
  )
}

export type PinflState = { pinfl: string; passport: string; stir: string; barcode: boolean }

export function PinflInputs({
  value,
  onChange,
  errors,
  dict,
}: {
  value: PinflState
  onChange: (next: PinflState) => void
  errors: Partial<Record<"pinfl" | "passport" | "stir", string>>
  dict: Dictionary
}) {
  const set = (patch: Partial<PinflState>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-col gap-4">
      <p className="flex gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {dict.pinfl.privacy}
      </p>
      <FormField id="pinfl" label={dict.pinfl.pinflLabel} error={errors.pinfl}>
        <Input
          id="pinfl"
          inputMode="numeric"
          autoComplete="off"
          maxLength={20}
          placeholder="31205901234567"
          value={value.pinfl}
          aria-invalid={!!errors.pinfl}
          onChange={(e) => set({ pinfl: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="passport"
          label={dict.pinfl.passportLabel}
          optional={dict.design.optional}
          error={errors.passport}
        >
          <Input
            id="passport"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={12}
            placeholder="AA1234567"
            value={value.passport}
            aria-invalid={!!errors.passport}
            onChange={(e) => set({ passport: e.target.value })}
          />
        </FormField>
        <FormField id="stir" label={dict.pinfl.stirLabel} optional={dict.design.optional} error={errors.stir}>
          <Input
            id="stir"
            inputMode="numeric"
            autoComplete="off"
            maxLength={12}
            placeholder="123456789"
            value={value.stir}
            aria-invalid={!!errors.stir}
            onChange={(e) => set({ stir: e.target.value })}
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="pinfl-barcode" checked={value.barcode} onCheckedChange={(barcode) => set({ barcode })} />
        <Label htmlFor="pinfl-barcode" className="font-normal">
          {dict.pinfl.barcodeToggle}
        </Label>
      </div>
    </div>
  )
}

export type WifiState = { ssid: string; password: string; security: WifiSecurity }

export function WifiInputs({
  value,
  onChange,
  errors,
  dict,
}: {
  value: WifiState
  onChange: (next: WifiState) => void
  errors: Partial<Record<"ssid" | "password", string>>
  dict: Dictionary
}) {
  const set = (patch: Partial<WifiState>) => onChange({ ...value, ...patch })
  const securityLabel = (s: WifiSecurity) =>
    ({ WPA: dict.wifi.securityWPA, WEP: dict.wifi.securityWEP, nopass: dict.wifi.securityNopass })[s]
  return (
    <div className="flex flex-col gap-4">
      <FormField id="ssid" label={dict.wifi.ssidLabel} error={errors.ssid}>
        <Input
          id="ssid"
          autoComplete="off"
          maxLength={32}
          placeholder={dict.wifi.ssidPlaceholder}
          value={value.ssid}
          aria-invalid={!!errors.ssid}
          onChange={(e) => set({ ssid: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
        <FormField id="wifi-password" label={dict.wifi.passwordLabel} error={errors.password}>
          <Input
            id="wifi-password"
            autoComplete="off"
            maxLength={63}
            disabled={value.security === "nopass"}
            value={value.security === "nopass" ? "" : value.password}
            aria-invalid={!!errors.password}
            onChange={(e) => set({ password: e.target.value })}
          />
        </FormField>
        <FormField id="wifi-security" label={dict.wifi.securityLabel}>
          <Select value={value.security} onValueChange={(s) => set({ security: s as WifiSecurity })}>
            <SelectTrigger id="wifi-security" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WIFI_SECURITY.map((s) => (
                <SelectItem key={s} value={s}>
                  {securityLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">{dict.wifi.hint}</p>
    </div>
  )
}

export function LinkInputs({
  value,
  onChange,
  error,
  dict,
}: {
  value: string
  onChange: (next: string) => void
  error?: string
  dict: Dictionary
}) {
  return (
    <div className="flex flex-col gap-4">
      <FormField id="link" label={dict.link.urlLabel} error={error} hint={dict.link.hint}>
        <Input
          id="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          maxLength={512}
          placeholder={dict.link.urlPlaceholder}
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
    </div>
  )
}
