import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { NextResponse, type NextRequest } from "next/server"

import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/i18n/config"

function preferredLocale(request: NextRequest) {
  const cookie = request.cookies.get("locale")?.value
  if (cookie && isLocale(cookie)) return cookie
  const headers = { "accept-language": request.headers.get("accept-language") ?? "" }
  const languages = new Negotiator({ headers }).languages()
  try {
    return match(languages, LOCALES, DEFAULT_LOCALE)
  } catch {
    return DEFAULT_LOCALE
  }
}

/** Constant-time compare that works in any runtime. */
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** The stats page sits behind HTTP basic auth; any user name, password from STATS_PASSWORD. */
function statsAuth(request: NextRequest) {
  const password = process.env.STATS_PASSWORD
  const header = request.headers.get("authorization") ?? ""
  let given: string | null = null
  try {
    if (header.startsWith("Basic ")) given = atob(header.slice(6)).split(":").slice(1).join(":")
  } catch {
    // Malformed header: treated as no credentials.
  }
  if (password && given !== null && safeEqual(given, password)) return NextResponse.next()
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Wallet stats", charset="UTF-8"' },
  })
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === "/stats" || pathname.startsWith("/stats/")) return statsAuth(request)

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return

  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Skip API routes, Next and Vercel internals (e.g. analytics) and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
