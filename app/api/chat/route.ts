import { NextResponse } from "next/server"

export const maxDuration = 30
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

const ABACUS_API_URL = process.env.ABACUS_API_URL || "https://apps.abacus.ai"
const ABACUS_DEPLOYMENT_TOKEN = process.env.ABACUS_DEPLOYMENT_TOKEN
const ABACUS_DEPLOYMENT_ID = process.env.ABACUS_DEPLOYMENT_ID
const ABACUS_API_KEY = process.env.ABACUS_API_KEY
const ABACUS_CONVERSATION_ID = process.env.ABACUS_CONVERSATION_ID

async function callAbacus(
  action: string,
  {
    body,
    query,
  }: {
    body?: Record<string, unknown>
    query?: Record<string, string | undefined>
  },
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (ABACUS_API_KEY) {
    headers.apiKey = ABACUS_API_KEY
  }

  const searchParams = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v) searchParams.append(k, v)
  })

  const hosts = [ABACUS_API_URL]
  if (!hosts.includes("https://api.abacus.ai")) {
    hosts.push("https://api.abacus.ai")
  }
  const attempted: string[] = []

  for (const host of hosts) {
    const url = `${host}/api/v0/${action}?${searchParams.toString()}`
    attempted.push(url)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body || {}),
        cache: "no-store",
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        throw new Error(errorText || `Falha em ${action} (status ${res.status})`)
      }

      const json = await res.json()
      if (json?.success === false) {
        throw new Error(json?.error || `Erro em ${action}`)
      }
      return json?.result ?? json
    } catch (err: any) {
      // tenta próximo host; se for o último, propaga detalhe
      if (host === hosts[hosts.length - 1]) {
        const msg = err?.message || "Erro ao chamar Abacus"
        throw new Error(`${msg} | attempted: ${attempted.join(", ")}`)
      }
    }
  }

  throw new Error(`Erro ao chamar ${action} | attempted: ${attempted.join(", ")}`)
}

export async function POST(req: Request) {
  if (!ABACUS_DEPLOYMENT_TOKEN || !ABACUS_DEPLOYMENT_ID) {
    return NextResponse.json(
      { error: "Configuração da Abacus ausente. Defina ABACUS_DEPLOYMENT_TOKEN e ABACUS_DEPLOYMENT_ID." },
      { status: 500 },
    )
  }

  const payload = await req.json()
  const bodyMessages: ChatMessage[] | undefined = payload?.messages
  const explicitText: string | undefined = payload?.message || payload?.text
  const incomingConversationId: string | undefined = payload?.conversationId
  const incomingExternalSessionId: string | undefined = payload?.externalSessionId

  const userText =
    explicitText ||
    (Array.isArray(bodyMessages)
      ? [...bodyMessages].reverse().find((m) => m.role === "user")?.text
      : undefined)

  if (!userText?.trim()) {
    return NextResponse.json({ error: "Mensagem do usuário ausente." }, { status: 400 })
  }

  let conversationId = incomingConversationId || ABACUS_CONVERSATION_ID || null
  let externalSessionId = incomingExternalSessionId || conversationId || null

  try {
    if (!conversationId) {
      const convo = await callAbacus("createDeploymentConversation", {
        query: { deploymentId: ABACUS_DEPLOYMENT_ID, deploymentToken: ABACUS_DEPLOYMENT_TOKEN },
        body: {},
      })
      conversationId =
        convo?.deploymentConversationId ||
        convo?.deployment_conversation_id ||
        convo?.id ||
        convo?.conversationId ||
        convo?.conversation_id
      externalSessionId = conversationId
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    }
    if (ABACUS_API_KEY) {
      headers.apiKey = ABACUS_API_KEY
    }

    const searchParams = new URLSearchParams({
      deploymentToken: ABACUS_DEPLOYMENT_TOKEN,
      deploymentId: ABACUS_DEPLOYMENT_ID,
    })

    const body = {
      message: userText,
      deploymentConversationId: conversationId,
      externalSessionId,
      temperature: 0,
      ignoreDocuments: false,
      includeSearchResults: true,
      executeUsercodeTool: true,
    }

    const baseHosts = [ABACUS_API_URL]
    if (!baseHosts.includes("https://api.abacus.ai")) {
      baseHosts.push("https://api.abacus.ai")
    }

    let abacusRes: Response | null = null
    const attempted: string[] = []
    for (const host of baseHosts) {
      const abacusUrl = `${host}/api/getStreamingConversationResponse?${searchParams.toString()}`
      attempted.push(abacusUrl)
      try {
        const res = await fetch(abacusUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          cache: "no-store",
        })
        if (res.ok && res.body) {
          abacusRes = res
          break
        }
        const errorText = await res.text().catch(() => "")
        return NextResponse.json(
          {
            error: errorText || "Falha ao chamar getStreamingConversationResponse",
            status: res.status,
            statusText: res.statusText,
            url: abacusUrl,
          },
          { status: res.status || 502 },
        )
      } catch (fetchErr: any) {
        // tenta próxima opção
        if (host === baseHosts[baseHosts.length - 1]) {
          return NextResponse.json(
            {
              error: fetchErr?.message || "Falha de rede ao contatar Abacus",
              attempted,
            },
            { status: 502 },
          )
        }
      }
    }

    if (!abacusRes || !abacusRes.body) {
      return NextResponse.json(
        { error: "Falha ao contatar Abacus.AI", attempted: baseHosts },
        { status: 502 },
      )
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let lastJson: any = null

    const stream = new ReadableStream({
      async start(controller) {
        const reader = abacusRes.body!.getReader()
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
              const payloadLine = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed
              if (payloadLine === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n"))
                continue
              }
              try {
                const obj = JSON.parse(payloadLine)
                lastJson = obj
              } catch {
                // ignore parse errors
              }
              controller.enqueue(encoder.encode(trimmed.startsWith("data:") ? `${trimmed}\n` : `data: ${trimmed}\n`))
            }
          }
          if (buffer.trim()) {
            const trimmed = buffer.trim()
            const payloadLine = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed
            try {
              const obj = JSON.parse(payloadLine)
              lastJson = obj
            } catch {
              // ignore
            }
            controller.enqueue(encoder.encode(trimmed.startsWith("data:") ? `${trimmed}\n` : `data: ${trimmed}\n`))
          }
          if (lastJson) {
            const meta = {
              conversationId:
                lastJson?.deploymentConversationId ||
                lastJson?.deployment_conversation_id ||
                lastJson?.conversationId ||
                lastJson?.conversation_id ||
                conversationId,
              externalSessionId: lastJson?.externalSessionId || lastJson?.external_session_id || externalSessionId,
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta })}\n`))
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
    return NextResponse.json({ error: err?.message || "Erro ao consultar a Abacus.AI" }, { status: 500 })
  }
}
