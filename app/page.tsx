"use client"

import { ChatInterface } from "@/components/chat-interface"
import { useLanguage } from "@/lib/language-context"

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8">
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="mb-3 font-mono text-3xl font-bold tracking-tight text-balance sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
          {t("helloTitle")} <span className="text-primary">{t("dataEngineer")}</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">{t("homeSubtitle")}</p>
      </div>

      <ChatInterface />

      <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-lg border bg-card p-4 text-center sm:p-6">
          <div className="mb-1 text-xl font-bold text-primary sm:mb-2 sm:text-2xl">5+</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t("yearsExp")}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center sm:p-6">
          <div className="mb-1 text-xl font-bold text-secondary sm:mb-2 sm:text-2xl">20+</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t("projectsCompleted")}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center sm:p-6">
          <div className="mb-1 text-xl font-bold text-accent sm:mb-2 sm:text-2xl">10+</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t("techMastered")}</div>
        </div>
      </div>
    </div>
  )
}
