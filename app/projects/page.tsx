"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useEffect, useMemo, useState } from "react"

type GithubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  pushed_at: string
  fork: boolean
}

export default function ProjectsPage() {
  const { t, language } = useLanguage()
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/github/repos", { cache: "no-store" })
        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(txt || `HTTP ${res.status}`)
        }
        const data = (await res.json()) as { repos?: GithubRepo[] }
        if (!cancelled) setRepos(Array.isArray(data?.repos) ? data.repos : [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Falha ao carregar repositórios")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const visibleRepos = useMemo(() => repos.filter((r) => r && !r.fork), [repos])

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("projectsTitle")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("projectsSubtitle")}</p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">GitHub</div>
              <div className="text-sm text-muted-foreground">NavajasThomaz</div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/NavajasThomaz" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                {t("viewCode")}
              </a>
            </Button>
          </div>
        </Card>

        {loading && <div className="text-sm text-muted-foreground">{language === "pt" ? "Carregando repositórios…" : "Loading repositories…"}</div>}
        {error && <div className="text-sm text-destructive">{error}</div>}

        {visibleRepos.map((repo) => (
          <Card key={repo.id} className="p-6">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{repo.name}</h3>
                {repo.description && <p className="mt-1 text-sm text-muted-foreground">{repo.description}</p>}
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  {t("viewCode")}
                </a>
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {repo.language && (
                <Badge variant="secondary" key={`${repo.id}-lang`}>
                  {repo.language}
                </Badge>
              )}
              {Array.isArray(repo.topics) &&
                repo.topics.slice(0, 6).map((tag) => (
                  <Badge key={`${repo.id}-${tag}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
