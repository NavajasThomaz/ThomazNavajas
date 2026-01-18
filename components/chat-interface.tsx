"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type FormEvent } from "react"
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
  const withBreaks = bolded.replace(/\n/g, "<br />")
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const [externalSessionId, setExternalSessionId] = useState<string | null>(null)
  const externalSessionIdRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

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

  const sendToAbacus = async (userText: string, assistantId: string) => {
    const payload = {
      message: userText,
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
      throw new Error(errorText || "Erro ao contatar o agente")
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

          let chunkText = chunkTextRaw
          if (chunkText) {
            if (fullText && chunkText.startsWith(fullText)) {
              fullText = chunkText
            } else if (fullText && fullText.includes(chunkText)) {
              // ignore duplicates
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
    if (!text.trim() || isLoading) return
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
      await sendToAbacus(userMsg.text, assistantId)
    } catch (err) {
      const fallback = t("noAnswerFallback")
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: fallback } : m)))
      messagesRef.current = messagesRef.current.map((m) => (m.id === assistantId ? { ...m, text: fallback } : m))
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

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
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold sm:text-base">{t("aiAssistant")}</span>
        <span className="ml-auto text-xs text-muted-foreground">{isLoading ? t("typing") : t("online")}</span>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={isLoading} className="text-xs">
          {t("clearChat")}
        </Button>
      </div>

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
            disabled={isLoading}
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">{t("send")}</span>
          </Button>
        </div>
      </form>
    </Card>
  )
}
