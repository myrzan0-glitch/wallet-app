import Link from "next/link"
import { notFound } from "next/navigation"

import { PassCreator } from "@/components/creator/pass-creator"
import { ModeToggle } from "@/components/mode-toggle"
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { cn } from "@/lib/utils"

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-10 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <span className="font-mono text-sm font-medium tracking-tight">wallet.myrzan</span>
        <nav className="flex items-center gap-1 text-xs">
          {LOCALES.map((l) => (
            <Link
              key={l}
              href={`/${l}`}
              hrefLang={l}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground",
                l === lang && "bg-accent text-foreground",
              )}
            >
              {LOCALE_NAMES[l]}
            </Link>
          ))}
          <ModeToggle dict={dict.theme} />
        </nav>
      </header>

      <section className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{dict.hero.title}</h1>
        <p className="text-base text-muted-foreground sm:text-lg">{dict.hero.subtitle}</p>
      </section>

      <PassCreator dict={dict} />

      <footer className="flex max-w-2xl flex-col gap-2 pb-4 text-xs text-muted-foreground">
        <p>{dict.privacy}</p>
        <p>{dict.footer}</p>
      </footer>
    </main>
  )
}
