"use client"

import { Analytics as VercelAnalytics } from "@vercel/analytics/next"

/**
 * Page views only. The desktop hand-off puts the whole form (card numbers,
 * Wi-Fi passwords) in the URL hash, so the hash and query never leave the page.
 */
export function Analytics() {
  return (
    <VercelAnalytics
      beforeSend={(event) => {
        const url = new URL(event.url)
        url.hash = ""
        url.search = ""
        return { ...event, url: url.toString() }
      }}
    />
  )
}
