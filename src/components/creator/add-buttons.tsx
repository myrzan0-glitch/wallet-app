"use client"

import { useEffect, useState } from "react"
import { Compass, Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AppleIcon, GoogleIcon } from "@/components/creator/brand-icons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Platform } from "@/lib/barcode/formats"
import type { Device } from "@/lib/client/device"
import { renderBarcodeSvg } from "@/lib/client/render"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"
import { cn } from "@/lib/utils"

type Props = {
  device: Device
  busy: Platform | null
  inAppBrowser: boolean
  onAdd: (platform: Platform) => void
  dict: Dictionary
}

/** Both wallets are offered; the one matching the device comes first. */
export function AddButtons({ device, busy, inAppBrowser, onAdd, dict }: Props) {
  const order: Platform[] = device === "android" ? ["google", "apple"] : ["apple", "google"]

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    toast.success(dict.inApp.copied)
  }

  return (
    <div className="flex flex-col gap-3">
      {inAppBrowser && (
        <Alert>
          <Compass />
          <AlertDescription className="gap-3">
            {dict.inApp.body}
            <Button variant="outline" size="sm" onClick={copyLink}>
              {dict.inApp.copy}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {order.map((platform, i) => (
        <Button
          key={platform}
          size="lg"
          // Styled after the official black "Add to … Wallet" badges, in both themes.
          className={cn(
            "h-12 bg-black text-base text-white hover:bg-black/85 dark:ring-1 dark:ring-white/20",
            i > 0 && "h-11 text-sm",
          )}
          disabled={busy !== null}
          onClick={() => onAdd(platform)}
        >
          {busy === platform ? (
            <Loader2 className="animate-spin" />
          ) : platform === "apple" ? (
            <AppleIcon className="size-5" />
          ) : (
            <GoogleIcon className="size-5" />
          )}
          {busy === platform
            ? dict.actions.working
            : platform === "apple"
              ? dict.actions.addApple
              : dict.actions.addGoogle}
        </Button>
      ))}
    </div>
  )
}

/** On desktop, Apple passes are opened on the phone via a QR code of the filled-in page. */
export function HandoffDialog({
  url,
  onClose,
  onDownload,
  dict,
}: {
  url: string | null
  onClose: () => void
  onDownload: () => void
  dict: Dictionary
}) {
  const [svg, setSvg] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    if (url) renderBarcodeSvg("qr", url).then((s) => !cancelled && setSvg(s))
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <Dialog open={url !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{dict.actions.handoffTitle}</DialogTitle>
          <DialogDescription>{dict.actions.handoffBody}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto w-56 rounded-xl bg-white p-4">
          {svg ? (
            // bwip-js output for our own URL; contains no user markup.
            <div className="[&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">{dict.actions.handoffNote}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onDownload}>
            <Download />
            {dict.actions.handoffDownload}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
