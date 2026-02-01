import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export const maxDuration = 60
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"
const CAPTCHA_COOKIE = "tn_captcha"
const CAPTCHA_TTL_SECONDS = 60 * 60 * 2

function captchaSecret() {
  return process.env.TURNSTILE_COOKIE_SECRET || process.env.TURNSTILE_SECRET_KEY || ""
}

function captchaOk(value: string | undefined) {
  const secret = captchaSecret()
  if (!secret) return true // fallback: sem captcha configurado, não bloquear
  if (!value) return false
  const parts = value.split(".")
  if (parts.length !== 2) return false
  const [tsRaw, sig] = parts
  const ts = Number(tsRaw)
  if (!Number.isFinite(ts) || ts <= 0) return false
  const now = Math.floor(Date.now() / 1000)
  if (now - ts > CAPTCHA_TTL_SECONDS) return false
  const expected = crypto.createHmac("sha256", secret).update(tsRaw).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const jar = await cookies()
  const cap = jar.get(CAPTCHA_COOKIE)?.value
  if (!captchaOk(cap)) {
    return NextResponse.json({ error: "Captcha necessário para usar o chat." }, { status: 403 })
  }

  const payload = await req.json()
  const bodyMessages: ChatMessage[] | undefined = payload?.messages
  const explicitText: string | undefined = payload?.message || payload?.text

  const userText =
    explicitText ||
    (Array.isArray(bodyMessages)
      ? [...bodyMessages].reverse().find((m) => m.role === "user")?.text
      : undefined)

  if (!userText?.trim()) {
    return NextResponse.json({ error: "Mensagem do usuário ausente." }, { status: 400 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        message: userText,
        messages: bodyMessages,
      }),
      cache: "no-store",
    })

    if (!res.ok || !res.body) {
      const errorText = await res.text().catch(() => "")
      return NextResponse.json(
        { error: errorText || "Falha ao contatar o Ollama", status: res.status, statusText: res.statusText },
        { status: res.status || 502 },
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader()
        let buffer = ""
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              controller.enqueue(encoder.encode(`${trimmed}\n`))
            }
          }
          if (buffer.trim()) {
            const trimmed = buffer.trim()
            controller.enqueue(encoder.encode(`${trimmed}\n`))
          }
          controller.enqueue(encoder.encode("data: [DONE]\n"))
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: (err as Error)?.message || "stream error" })}\n`),
          )
          controller.enqueue(encoder.encode("data: [DONE]\n"))
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro ao consultar o Ollama" }, { status: 500 })
  }
}
