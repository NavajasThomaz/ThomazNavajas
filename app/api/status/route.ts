import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json({ ok: false, backend_ok: false, ollama_ok: false }, { status: 200 })
    }
    const data = (await res.json()) as {
      status?: string
      ollama_ok?: boolean
      model?: string
      source?: string
      embedding_enabled?: boolean
      embedding_model?: string | null
      embedding_source?: string | null
      embedding_used?: boolean
    }
    const ollamaOk = Boolean(data?.ollama_ok)
    return NextResponse.json(
      {
        ok: true,
        backend_ok: true,
        ollama_ok: ollamaOk,
        model: data?.model,
        source: data?.source,
        embedding_enabled: data?.embedding_enabled,
        embedding_model: data?.embedding_model,
        embedding_source: data?.embedding_source,
        embedding_used: data?.embedding_used,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ ok: false, backend_ok: false, ollama_ok: false }, { status: 200 })
  }
}

