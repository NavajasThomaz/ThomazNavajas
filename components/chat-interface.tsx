"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, User, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import chatbotImg from "@/public/chatbot.png"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  segments?: ChatSegment[]
}

type ChatSegment = {
  type?: string
  title?: string | null
  segment?: any
  isSpinny?: boolean
}

const STORAGE_KEY = "tn-chat-messages"
const CONVERSATION_KEY = "tn-conversation-id"
const MAX_SEGMENT_PREVIEW = 240
const GENERIC_SEGMENT_IGNORE = ["processing", "searching documents"]
const MAX_HISTORY_MESSAGES = 16

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function renderRichText(text: string) {
  const escaped = escapeHtml(text || "")
  const bolded = escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
  const withMdLinks = bolded.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g,
    (_m, label: string, href: string) => {
      const safeHref = href.startsWith("/") || href.startsWith("http://") || href.startsWith("https://") ? href : "#"
      return `<a href="${safeHref}" class="underline underline-offset-4" target="${
        safeHref.startsWith("http") ? "_blank" : "_self"
      }" rel="noopener noreferrer">${label}</a>`
    },
  )
  const withAutoLinks = withMdLinks.replace(
    /(\bhttps?:\/\/[^\s<]+|(?:^|[\s(])\/[a-z0-9\-/_?=&]+)(?=$|[\s).,])/gi,
    (match: string) => {
      const raw = match.trim()
      const prefix = match.startsWith(" ") || match.startsWith("(") ? match[0] : ""
      const url = raw.startsWith("/") || raw.startsWith("http://") || raw.startsWith("https://") ? raw : ""
      if (!url) return match
      const target = url.startsWith("http") ? "_blank" : "_self"
      return `${prefix}<a href="${url}" class="underline underline-offset-4" target="${target}" rel="noopener noreferrer">${url}</a>`
    },
  )
  const withBreaks = withAutoLinks.replace(/\n/g, "<br />")
  return withBreaks
}

function formatSegment(seg: ChatSegment) {
  const rawSegment = seg?.segment
  let text = ""

  if (typeof rawSegment === "string") {
    text = rawSegment
  } else if (rawSegment && typeof rawSegment === "object" && typeof rawSegment.segment === "string") {
    text = rawSegment.segment
  } else if (typeof seg?.title === "string") {
    text = seg.title
  } else if (typeof seg?.type === "string") {
    text = seg.type
  }

  if (!text) {
    try {
      text = JSON.stringify(seg)
    } catch {
      text = "[segment]"
    }
  }

  if (text.length > MAX_SEGMENT_PREVIEW) {
    text = `${text.slice(0, MAX_SEGMENT_PREVIEW)}…`
  }

  const prefix = seg?.title && seg.title !== text ? `${seg.title}: ` : ""
  return `${prefix}${text}`
}

function extractSegmentText(seg: ChatSegment) {
  if (!seg) return ""
  const rawSegment = seg.segment
  if (typeof rawSegment === "string") return rawSegment
  if (rawSegment && typeof rawSegment === "object" && typeof rawSegment.segment === "string") return rawSegment.segment
  if (typeof seg.title === "string") return seg.title
  if (typeof seg.type === "string") return seg.type
  return ""
}

function shouldDisplaySegment(seg: ChatSegment, mainMessage: string) {
  const text = extractSegmentText(seg).trim()
  if (!text) return false
  if (mainMessage && text === mainMessage.trim()) return false
  const lower = text.toLowerCase()
  if (GENERIC_SEGMENT_IGNORE.includes(lower)) return false
  if (seg.isSpinny && GENERIC_SEGMENT_IGNORE.some((g) => lower.startsWith(g))) return false
  return true
}

export function ChatInterface() {
  const { t } = useLanguage()
  const turnstileSiteKey = useMemo(() => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "", [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const [externalSessionId, setExternalSessionId] = useState<string | null>(null)
  const externalSessionIdRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null)
  const [captchaOk, setCaptchaOk] = useState<boolean | null>(null)
  const [captchaError, setCaptchaError] = useState(false)
  const [turnstileReady, setTurnstileReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const savedConversation = localStorage.getItem(CONVERSATION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        setMessages(parsed)
        messagesRef.current = parsed
      }
      if (savedConversation) {
        setConversationId(savedConversation)
        conversationIdRef.current = savedConversation
        setExternalSessionId(savedConversation)
        externalSessionIdRef.current = savedConversation
      }
    } catch {
      // ignore parse errors
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as any).tnTurnstileOk = async (token: string) => {
      try {
        setCaptchaError(false)
        const res = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          cache: "no-store",
        })
        const data = (await res.json().catch(() => ({}))) as any
        if (data?.ok) {
          setCaptchaOk(true)
          return
        }
        setCaptchaOk(false)
        setCaptchaError(true)
      } catch {
        setCaptchaOk(false)
        setCaptchaError(true)
      }
    }
    ;(window as any).tnTurnstileErr = () => {
      setCaptchaOk(false)
      setCaptchaError(true)
    }
    return () => {
      try {
        delete (window as any).tnTurnstileOk
        delete (window as any).tnTurnstileErr
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (!turnstileReady) return
    if (!turnstileSiteKey) return
    if (typeof window === "undefined") return
    if (ollamaOk === false) return
    if (captchaOk !== false) return
    if (!turnstileRef.current) return

    const turnstile = (window as any).turnstile
    if (!turnstile || typeof turnstile.render !== "function") return

    // Re-render safely
    try {
      if (turnstileWidgetIdRef.current) {
        try {
          turnstile.remove(turnstileWidgetIdRef.current)
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null
      }
      turnstileRef.current.innerHTML = ""
    } catch {
      // ignore
    }

    try {
      const id = turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: "auto",
        callback: (token: string) => (window as any).tnTurnstileOk?.(token),
        "error-callback": () => (window as any).tnTurnstileErr?.(),
        "expired-callback": () => (window as any).tnTurnstileErr?.(),
      })
      turnstileWidgetIdRef.current = id
    } catch {
      // ignore
    }
  }, [turnstileReady, turnstileSiteKey, ollamaOk, captchaOk])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    messagesRef.current = messages
  }, [messages, hydrated])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    if (conversationId) {
      localStorage.setItem(CONVERSATION_KEY, conversationId)
    }
  }, [conversationId, hydrated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    async function check() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" })
        const data = (await res.json().catch(() => ({}))) as any
        if (!cancelled) setOllamaOk(Boolean(data?.ollama_ok))
      } catch {
        if (!cancelled) setOllamaOk(false)
      }
    }
    void check()
    const id = window.setInterval(check, 30000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    async function checkCaptcha() {
      try {
        const res = await fetch("/api/captcha/status", { cache: "no-store" })
        const data = (await res.json().catch(() => ({}))) as any
        if (!cancelled) setCaptchaOk(Boolean(data?.ok))
      } catch {
        if (!cancelled) setCaptchaOk(false)
      }
    }
    void checkCaptcha()
    return () => {
      cancelled = true
    }
  }, [])

  const sendToOllama = async (userText: string, assistantId: string) => {
    if (ollamaOk === false) {
      throw new Error("offline")
    }
    if (captchaOk === false) {
      throw new Error("captcha")
    }
    const history = messagesRef.current
      .filter((m) => m.id !== assistantId)
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, text: m.text }))
    const payload = {
      message: userText,
      messages: history,
      conversationId: conversationIdRef.current,
      externalSessionId: externalSessionIdRef.current,
    }

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!resp.body || !resp.ok) {
      const errorText = await resp.text().catch(() => "")
      throw new Error(errorText || "Erro ao contatar o Ollama")
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let fullText = ""
    let finalSegments: ChatSegment[] = []
    let resultConversationId = conversationIdRef.current
    let resultExternalSessionId = externalSessionIdRef.current
    let firstChunkReceived = false

    const updateAssistant = (text: string, segments?: ChatSegment[]) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text,
                segments: segments ?? m.segments,
              }
            : m,
        ),
      )
      messagesRef.current = messagesRef.current.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              text,
              segments: segments ?? m.segments,
            }
          : m,
      )
    }

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
        if (payloadLine === "[DONE]") continue
        try {
          const obj = JSON.parse(payloadLine)
          if (obj?.error) {
            throw new Error(obj.error)
          }
          resultConversationId =
            obj?.deploymentConversationId ||
            obj?.deployment_conversation_id ||
            obj?.conversationId ||
            obj?.conversation_id ||
            resultConversationId
          resultExternalSessionId = obj?.externalSessionId || obj?.external_session_id || resultExternalSessionId

          const abacusSegments: ChatSegment[] = Array.isArray(obj?.segments)
            ? obj.segments
            : Array.isArray(obj?.segment)
              ? obj.segment
              : []

          const metaConv =
            obj?.meta?.conversationId ||
            obj?.meta?.conversation_id ||
            obj?.deploymentConversationId ||
            obj?.deployment_conversation_id ||
            obj?.conversationId ||
            obj?.conversation_id
          const metaExt = obj?.meta?.externalSessionId || obj?.meta?.external_session_id || obj?.externalSessionId
          if (metaConv) {
            resultConversationId = metaConv
          }
          if (metaExt) {
            resultExternalSessionId = metaExt
          }

          const chunkTextRaw =
            obj?.message ||
            obj?.text ||
            obj?.reply ||
            (Array.isArray(obj?.messages)
              ? [...obj.messages].reverse().find((m: any) => m?.is_user === false)?.text
              : "") ||
            ""

          const chunkText = chunkTextRaw
          if (chunkText) {
            if (fullText && chunkText.startsWith(fullText)) {
              fullText = chunkText
            } else {
              fullText = `${fullText}${chunkText}`
            }
            const cleanedSegments = abacusSegments.filter((seg) => shouldDisplaySegment(seg, fullText))
            if (cleanedSegments.length > 0) {
              finalSegments = cleanedSegments
            }
            updateAssistant(fullText, finalSegments)
            if (!firstChunkReceived) {
              firstChunkReceived = true
              setIsLoading(false)
            }
          }
        } catch (streamErr) {
          setIsLoading(false)
          throw streamErr
        }
      }
    }

    if (resultConversationId && typeof resultConversationId === "string") {
      setConversationId(resultConversationId)
      conversationIdRef.current = resultConversationId
    }
    if (resultExternalSessionId && typeof resultExternalSessionId === "string") {
      setExternalSessionId(resultExternalSessionId)
      externalSessionIdRef.current = resultExternalSessionId
    }

    if (!fullText) {
      fullText = t("noAnswerFallback")
      updateAssistant(fullText, finalSegments)
    }

    return {
      text: fullText,
      segments: finalSegments,
    }
  }

  const sendMessageText = async (text: string) => {
    if (!text.trim() || isLoading || ollamaOk === false || captchaOk === false) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text.trim(),
    }
    const assistantId = crypto.randomUUID()
    const nextHistory = [
      ...messagesRef.current,
      userMsg,
      { id: assistantId, role: "assistant", text: t("typing"), segments: [] },
    ]
    setMessages(nextHistory)
    messagesRef.current = nextHistory
    setIsLoading(true)
    try {
      await sendToOllama(userMsg.text, assistantId)
    } catch (err) {
      const fallback = t("noAnswerFallback")
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: fallback } : m)))
      messagesRef.current = messagesRef.current.map((m) => (m.id === assistantId ? { ...m, text: fallback } : m))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const injectStaticExchange = (question: string, answer: string) => {
    if (!question.trim() || !answer.trim()) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: question.trim(),
    }
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: answer.trim(),
      segments: [],
    }
    const nextHistory = [...messagesRef.current, userMsg, assistantMsg]
    setMessages(nextHistory)
    messagesRef.current = nextHistory
    setIsLoading(false)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent)?.detail as { question?: string } | undefined
      const q = (detail?.question || "").toString()
      if (!q.trim()) return
      if (ollamaOk === false) return
      void sendMessageText(q)
    }
    window.addEventListener("tn-chat-ask", handler as EventListener)
    return () => window.removeEventListener("tn-chat-ask", handler as EventListener)
  }, [sendMessageText, ollamaOk])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent)?.detail as { question?: string; answer?: string } | undefined
      const q = (detail?.question || "").toString()
      const a = (detail?.answer || "").toString()
      if (!q.trim() || !a.trim()) return
      injectStaticExchange(q, a)
    }
    window.addEventListener("tn-chat-faq", handler as EventListener)
    return () => window.removeEventListener("tn-chat-faq", handler as EventListener)
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement> | { preventDefault: () => void }) => {
    e.preventDefault()
    const input = inputRef.current?.value || ""
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    await sendMessageText(input)
  }

  const handleSuggestedQuestion = async (question: string) => {
    const q = (question || "").toString()
    if (!q.trim()) return
    try {
      await sendMessageText(q)
    } catch (err) {
      console.error("Erro ao enviar sugestão", err)
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [t("q1"), t("q2"), t("q3"), t("q4")].filter(Boolean)

  const isEmpty = messages.length === 0

  const handleClear = () => {
    setMessages([])
    setConversationId(null)
    setExternalSessionId(null)
    conversationIdRef.current = null
    externalSessionIdRef.current = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CONVERSATION_KEY)
    }
  }

  return (
    <Card className="mx-auto w-full overflow-hidden border-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileReady(true)}
      />
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold sm:text-base">{t("aiAssistant")}</span>
        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              ollamaOk === false ? "bg-red-500" : ollamaOk === true ? "bg-green-500" : "bg-muted-foreground/40"
            }`}
          />
          <span>{ollamaOk === false ? t("offline") : t("online")}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading} className="text-xs">
          {t("clearChat")}
        </Button>
      </div>
      {ollamaOk === false && (
        <div className="border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">{t("modelOfflineNotice")}</div>
      )}

      {/* Captcha gate (does not block FAQs) */}
      {ollamaOk !== false && captchaOk === false && (
        <div className="border-b bg-muted/20 px-4 py-3">
          <div className="mb-2 text-sm font-semibold">{t("captchaTitle")}</div>
          <div className="mb-3 text-xs text-muted-foreground">{t("captchaSubtitle")}</div>

          {captchaError && <div className="mb-2 text-xs text-destructive">{t("captchaError")}</div>}

          {turnstileSiteKey ? (
            <div ref={turnstileRef} />
          ) : (
            <div className="text-xs text-muted-foreground">{t("captchaMissingConfig")}</div>
          )}
        </div>
      )}

      <div className="h-[400px] overflow-y-auto p-3 sm:h-[500px] sm:p-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Image
                src={chatbotImg}
                alt="Assistente virtual"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                priority
              />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-sm font-semibold sm:text-base">{t("startConversation")}</h3>
              <p className="mb-4 text-xs text-muted-foreground sm:text-sm">{t("askAnything")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs"
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    <Image
                      src={chatbotImg}
                      alt="Assistente virtual"
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 sm:max-w-[80%] sm:px-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderRichText(message.text) }}
                  />
                  {message.segments && message.segments.length > 0 && (
                    <div className="mt-2 rounded-md border bg-background/60 p-2 text-xs text-muted-foreground">
                      <div className="mb-1 font-semibold">Processo interno</div>
                      <ul className="space-y-1">
                        {message.segments.map((seg, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            {seg.isSpinny ? (
                              <Loader2 className="mt-0.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Image
                                src={chatbotImg}
                                alt="Assistente virtual"
                                width={14}
                                height={14}
                                className="mt-0.5 h-3.5 w-3.5 rounded-full object-cover"
                              />
                            )}
                            <span>{formatSegment(seg)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3 sm:p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={t("askPlaceholder")}
            disabled={isLoading || ollamaOk === false || captchaOk === false}
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading || ollamaOk === false || captchaOk === false}>
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("send")}</span>
          </Button>
        </div>
      </form>
    </Card>
  )
}
