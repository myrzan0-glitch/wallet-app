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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-8 sm:py-14">
      <header className="flex items-center justify-between gap-4">
        <span className="font-mono text-sm font-medium tracking-tight">wallet.myrzan</span>
        <nav className="flex items-center gap-1 font-mono text-xs">
          {LOCALES.map((l) => (
            <Link
              key={l}
              href={`/${l}`}
              hrefLang={l}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground",
                l === lang && "bg-accent text-foreground"
              )}
            >
              {LOCALE_NAMES[l]}
            </Link>
          ))}
          <ModeToggle dict={dict.theme} />
        </nav>
      </header>

      <section className="flex flex-col gap-8">
        <p className="text-xl leading-relaxed text-muted-foreground sm:text-2xl">{dict.hero.tagline}</p>
        <ol className="flex flex-col gap-4">
          {dict.hero.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4 font-mono text-sm text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-[11px] font-semibold text-primary-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <PassCreator dict={dict} />

      <footer className="flex flex-col gap-2 pb-4 font-mono text-xs text-muted-foreground">
        <p>{dict.privacy}</p>
        <p>{dict.footer}</p>
      </footer>
    </main>
  )
}
