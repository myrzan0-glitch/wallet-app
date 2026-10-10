"use client"

import Link from "next/link"
import { Check, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config"

export function LanguageSwitcher({ lang, label }: { lang: Locale; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={label}>
          <Globe />
          {LOCALE_NAMES[lang]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link href={`/${l}`} hrefLang={l} lang={l}>
              {LOCALE_NAMES[l]}
              {l === lang && <Check className="ml-auto" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
