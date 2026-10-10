import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { LOCALES, isLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import "../globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic", "cyrillic-ext"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic", "cyrillic-ext"] })

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://wallet.myrzan.com"),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: { title: dict.meta.title, description: dict.meta.description, type: "website" },
  }
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  return (
    <html lang={lang} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
