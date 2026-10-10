import { Suspense } from "react"
import { connection } from "next/server"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Platform } from "@/lib/barcode/formats"
import type { StatEvent } from "@/lib/stats/keys"
import { readStats, type Counts } from "@/lib/stats/store"
import { TEMPLATES } from "@/lib/templates"

const PLATFORMS: Platform[] = ["apple", "google"]
const PLATFORM_NAMES: Record<Platform, string> = { apple: "Apple", google: "Google" }
const TEMPLATE_NAMES = { card: "Card", wifi: "Wi-Fi", link: "Link" }

const count = (counts: Counts, event: StatEvent, platform: Platform, template?: string) =>
  Number(counts[template ? `${event}:${platform}:${template}` : `${event}:${platform}`] ?? 0)
const both = (counts: Counts, event: StatEvent, template?: string) =>
  PLATFORMS.reduce((sum, p) => sum + count(counts, event, p, template), 0)
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—")

export default function StatsPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Wallet stats</h1>
        <p className="text-sm text-muted-foreground">
          Passes created on the site, and passes Apple and Google report as added to a wallet. Days are in Tashkent
          time.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <Stats />
      </Suspense>
    </main>
  )
}

function Stat({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function Split({ counts, event }: { counts: Counts; event: StatEvent }) {
  return PLATFORMS.map((p) => `${PLATFORM_NAMES[p]} ${count(counts, event, p)}`).join(" · ")
}

const th = "px-3 py-2 text-right font-medium whitespace-nowrap first:text-left"
const td = "px-3 py-2 text-right tabular-nums whitespace-nowrap first:text-left"

async function Stats() {
  await connection()
  const stats = await readStats(30)
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage is not connected</CardTitle>
          <CardDescription>
            Add Upstash Redis in Vercel → Storage, connect it to this project and redeploy. Counting starts then.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { total, days, appleDevices } = stats
  const generated = both(total, "generated")
  const added = both(total, "added")

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat title="Passes generated" value={generated} detail={Split({ counts: total, event: "generated" })} />
        <Stat title="Added to a wallet" value={added} detail={Split({ counts: total, event: "added" })} />
        <Stat
          title="Added ÷ generated"
          value={percent(added, generated)}
          detail={PLATFORMS.map(
            (p) => `${PLATFORM_NAMES[p]} ${percent(count(total, "added", p), count(total, "generated", p))}`,
          ).join(" · ")}
        />
        <Stat
          title="iPhones with a pass"
          value={appleDevices}
          detail={`Approximate unique devices · removed ${both(total, "removed")}`}
        />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>By template</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-3">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className={th}>Template</th>
                <th className={th}>Generated</th>
                <th className={th}>Added</th>
                <th className={th}>Added %</th>
              </tr>
            </thead>
            <tbody>
              {TEMPLATES.map((t) => (
                <tr key={t} className="border-b last:border-0">
                  <td className={td}>{TEMPLATE_NAMES[t]}</td>
                  <td className={td}>{both(total, "generated", t)}</td>
                  <td className={td}>{both(total, "added", t)}</td>
                  <td className={td}>{percent(both(total, "added", t), both(total, "generated", t))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-3">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className={th}>Day</th>
                <th className={th}>Generated Apple</th>
                <th className={th}>Generated Google</th>
                <th className={th}>Added Apple</th>
                <th className={th}>Added Google</th>
                <th className={th}>Removed</th>
              </tr>
            </thead>
            <tbody>
              {days.map(({ date, counts }) => (
                <tr key={date} className="border-b last:border-0">
                  <td className={td}>{date}</td>
                  <td className={td}>{count(counts, "generated", "apple")}</td>
                  <td className={td}>{count(counts, "generated", "google")}</td>
                  <td className={td}>{count(counts, "added", "apple")}</td>
                  <td className={td}>{count(counts, "added", "google")}</td>
                  <td className={td}>{both(counts, "removed")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
