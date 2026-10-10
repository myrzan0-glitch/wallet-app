import "server-only"

import { createHash } from "node:crypto"
import { Redis } from "@upstash/redis"

import type { Platform } from "@/lib/barcode/formats"
import { lastDays, statDay, statFields, type StatEvent } from "@/lib/stats/keys"
import type { Template } from "@/lib/templates"

const DAY_TTL = 400 * 86_400
const SEEN_TTL = 2 * 365 * 86_400

let client: Redis | undefined

/** Upstash from the Vercel Marketplace sets the KV_* names; a direct setup uses UPSTASH_*. */
function redis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  client ??= new Redis({ url, token })
  return client
}

export const hashId = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32)

type RecordOptions = {
  template?: Template
  /** Counts the event only once per id (a pass serial or object id). */
  once?: string
  /** Device id for the unique-devices estimate; only its hash is stored. */
  device?: string
}

/**
 * Bumps the counters for an event. Only counts are stored: no card data and
 * no device ids. Returns false when `once` was already counted.
 */
export async function recordStat(event: StatEvent, platform: Platform, options: RecordOptions = {}) {
  const db = redis()
  if (!db) return true
  try {
    if (options.once) {
      const fresh = await db.set(`stats:seen:${event}:${platform}:${options.once}`, 1, { nx: true, ex: SEEN_TTL })
      if (!fresh) return false
    }
    const day = `stats:day:${statDay(new Date())}`
    const tx = db.pipeline()
    for (const field of statFields(event, platform, options.template)) {
      tx.hincrby("stats:total", field, 1)
      tx.hincrby(day, field, 1)
    }
    tx.expire(day, DAY_TTL)
    if (options.device) tx.pfadd(`stats:devices:${platform}`, hashId(options.device))
    await tx.exec()
  } catch (error) {
    // Stats must never break pass creation.
    console.error("stats failed", (error as Error).message)
  }
  return true
}

export type Counts = Record<string, number>

export async function readStats(days: number) {
  const db = redis()
  if (!db) return null
  const dates = lastDays(days)
  const tx = db.pipeline()
  tx.hgetall<Counts>("stats:total")
  for (const date of dates) tx.hgetall<Counts>(`stats:day:${date}`)
  tx.pfcount("stats:devices:apple")
  const results = await tx.exec<unknown[]>()
  return {
    total: (results[0] as Counts | null) ?? {},
    days: dates.map((date, i) => ({ date, counts: (results[i + 1] as Counts | null) ?? {} })),
    appleDevices: results[dates.length + 1] as number,
  }
}
