import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GITHUB_USER = "NavajasThomaz"

export async function GET() {
  try {
    const url = new URL(`https://api.github.com/users/${GITHUB_USER}/repos`)
    url.searchParams.set("per_page", "100")
    url.searchParams.set("sort", "pushed")
    url.searchParams.set("direction", "desc")

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      // Always fresh (simple + predictable)
      cache: "no-store",
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => "")
      return NextResponse.json({ error: txt || `GitHub HTTP ${res.status}` }, { status: 502 })
    }

    const raw = (await res.json()) as any[]
    const repos = (Array.isArray(raw) ? raw : []).map((r) => ({
      id: r?.id,
      name: r?.name,
      full_name: r?.full_name,
      html_url: r?.html_url,
      description: r?.description ?? null,
      language: r?.language ?? null,
      topics: Array.isArray(r?.topics) ? r.topics : [],
      stargazers_count: typeof r?.stargazers_count === "number" ? r.stargazers_count : 0,
      pushed_at: r?.pushed_at,
      fork: Boolean(r?.fork),
    }))

    return NextResponse.json({ repos })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao buscar GitHub" }, { status: 500 })
  }
}

