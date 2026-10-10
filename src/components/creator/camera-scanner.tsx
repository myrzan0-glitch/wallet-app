"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { detectCode, type DetectedCode } from "@/lib/client/detect"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (code: DetectedCode) => void
  dict: Dictionary["code"]
}

export function CameraScanner({ open, onOpenChange, onDetected, dict }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const scan = async () => {
      const video = videoRef.current
      if (stopped || !video) return
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        const code = await detectCode(video).catch(() => null)
        if (code && !stopped) {
          onDetected(code)
          onOpenChange(false)
          return
        }
      }
      timer = setTimeout(scan, 200)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (s) => {
        stream = s
        if (stopped || !videoRef.current) return
        videoRef.current.srcObject = s
        await videoRef.current.play()
        scan()
      })
      .catch(() => setError(true))

    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
      setError(false)
    }
  }, [open, onDetected, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.cameraTitle}</DialogTitle>
          <DialogDescription>{error ? dict.cameraError : dict.cameraHint}</DialogDescription>
        </DialogHeader>
        {!error && (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-md border-2 border-white/80" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {dict.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
