"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChatInterface } from "@/components/chat-interface"
import { useLanguage } from "@/lib/language-context"
import { useMemo, useState } from "react"

export default function Home() {
  const { t, language } = useLanguage()
  const [isFaqOpen, setIsFaqOpen] = useState(true)

  const commonQuestions = useMemo(() => {
    const pt = [
      {
        q: "Quantos anos de experiência com Python você tem?",
        a: [
          "Eu uso Python desde 2021. Considerando os períodos que eu consigo datar no meu histórico (estágio, pesquisa e atuação atual), isso dá **aprox. 4–5 anos** de prática com Python.",
          "No dia a dia eu aplico Python principalmente para: engenharia de dados (ETL/ELT e qualidade), APIs (FastAPI) e integração/automação (Selenium/APIs/arquivos).",
        ].join("\n"),
      },
      {
        q: "Qual sua experiência com ETL/ELT e modelagem bronze/prata/ouro?",
        a: [
          "Eu trabalho com ETL/ELT e modelagem bronze/prata/ouro no contexto de ingestão/normalização e exposição de dados via API.",
          "Pontos que eu costumo priorizar: qualidade (parsing/normalização), deduplicação/delta, idempotência (conceitos), auditoria/rastreabilidade de execuções e observabilidade.",
          "Ferramentas/stack que aparecem no meu trabalho: SQL (MySQL/PostgreSQL), MongoDB (Motor), e também conceitos/ferramentas como Airflow, dbt, Kafka, Databricks e PySpark.",
        ].join("\n"),
      },
      {
        q: "Você já trabalhou com FastAPI e integrações (Selenium/APIs/arquivos)?",
        a: [
          "Sim. Na Allcom eu construí APIs com FastAPI e uma plataforma Docker que integra MySQL (SQLAlchemy) e automações com Selenium para baixar relatórios (CSV/XLSX/ZIP), extrair, normalizar e expor dados via API.",
          "Além disso, implementei uma plataforma de **chat multi‑agente** com FastAPI + MongoDB (Motor async), persistindo conversas e metadados.",
          "Também atuo com ingestão via arquivos e consumo de APIs (incluindo HTTP assíncrono com `httpx`) e integrações com serviços.",
        ].join("\n"),
      },
      {
        q: "Como você aplica LLMs (LangChain/RAG/Ollama) no seu trabalho?",
        a: [
          "Eu aplico LLMs principalmente em chat/assistentes e em pipelines de extração estruturada de dados.",
          "Exemplos práticos: chat multi‑agente com LangChain, streaming em tempo real (SSE/WebSocket) e pipeline de OCR (Tesseract) + extração estruturada via LLM (incluindo uso de OpenAI Files API quando faz sentido).",
          "Também tenho experiência com SLMs locais via Ollama.",
        ].join("\n"),
      },
      {
        q: "Você tem experiência com MongoDB (Motor async) e SQLAlchemy?",
        a: [
          "Sim. Eu já implementei soluções com MongoDB usando Motor (async) para persistir conversas e metadados, e também uso SQLAlchemy (ORM) com MySQL em APIs e pipelines de dados.",
          "Normalmente eu foco em integridade do dado, performance (índices/queries) e rastreabilidade.",
        ].join("\n"),
      },
      {
        q: "Qual foi um resultado/impacto que você considera forte no seu trabalho?",
        a: [
          "Um exemplo bem direto: eu otimizei uma ingestão de faturas em alto volume, reescrevendo o leitor para processar ~2,5M itens.",
          "O tempo caiu de ~23h para ~30min (aprox. **46×** mais rápido), sem aumento de custo.",
        ].join("\n"),
      },
      {
        q: "Você tem experiência com streaming em tempo real (SSE/WebSocket)?",
        a: [
          "Sim. Eu implementei streaming de respostas em tempo real (SSE) e WebSocket, com controle de chunks, fallback automático e renderização segura de conteúdo.",
        ].join("\n"),
      },
      {
        q: "Qual sua experiência com OCR e extração de dados de PDFs/imagens?",
        a: [
          "Eu já construí pipeline de ingestão de documentos/imagens com OCR (Tesseract) + extração estruturada via LLM.",
          "Também implementei heurística para detectar PDFs sem camada de texto e usei OpenAI Files API (upload/cleanup) quando fazia sentido para eficiência/custo.",
        ].join("\n"),
      },
      {
        q: "Você já trabalhou com Airflow, dbt, Kafka, Databricks e PySpark?",
        a: [
          "Sim — esses tópicos aparecem no meu stack e na forma como eu abordo engenharia de dados: pipelines/ETL/ELT, processamento distribuído e integração.",
          "Na prática, eu já usei/uso ferramentas e conceitos como PySpark, Hadoop, Databricks, dbt, Kafka e Airflow.",
        ].join("\n"),
      },
      {
        q: "Qual é a sua formação e qual seu nível de inglês?",
        a: [
          "Eu sou Engenheiro de Computação (FURG), com conclusão em 03/2025, e atualmente curso MBA em Engenharia de Dados na FIAP.",
          "Inglês: avançado.",
        ].join("\n"),
      },
    ]
    const en = [
      {
        q: "How many years of Python experience do you have?",
        a: [
          "I’ve been using Python since 2021. Based on the dated periods in my background (internship, research and my current role), that’s **roughly 4–5 years** of hands-on Python.",
          "Day-to-day I use Python mainly for data engineering (ETL/ELT and data quality), APIs (FastAPI), and integrations/automation (Selenium/APIs/files).",
        ].join("\n"),
      },
      {
        q: "What’s your experience with ETL/ELT and bronze/silver/gold modeling?",
        a: [
          "I work with ETL/ELT and bronze/silver/gold modeling in the context of ingestion, normalization, and exposing curated data via APIs.",
          "I usually prioritize: data quality (parsing/normalization), dedup/delta, idempotency (concepts), execution auditing/traceability, and observability.",
          "Tools/stack I’ve used include SQL (MySQL/PostgreSQL), MongoDB (Motor), and also concepts/tools like Airflow, dbt, Kafka, Databricks and PySpark.",
        ].join("\n"),
      },
      {
        q: "Have you worked with FastAPI and integrations (Selenium/APIs/files)?",
        a: [
          "Yes. At Allcom I built FastAPI APIs and a Docker platform integrating MySQL (SQLAlchemy) plus Selenium automations to download reports (CSV/XLSX/ZIP), extract, normalize and expose data via API.",
          "I also implemented a **multi-agent chat platform** with FastAPI + MongoDB (Motor async), persisting conversations and metadata.",
          "I also work with file ingestion and API consumption (including async HTTP with `httpx`) and service integrations.",
        ].join("\n"),
      },
      {
        q: "How do you use LLMs (LangChain/RAG/Ollama) in your work?",
        a: [
          "I use LLMs mainly for chat/assistants and structured extraction pipelines.",
          "Practical examples: multi-agent chat with LangChain, real-time streaming (SSE/WebSocket), and an OCR (Tesseract) + structured extraction pipeline (including OpenAI Files API when it makes sense).",
          "I also have experience running local SLMs via Ollama.",
        ].join("\n"),
      },
      {
        q: "Do you have experience with MongoDB (Motor async) and SQLAlchemy?",
        a: [
          "Yes. I’ve implemented solutions with MongoDB using Motor (async) to persist conversations and media metadata, and I also use SQLAlchemy (ORM) with MySQL in APIs and data pipelines.",
          "I typically focus on data integrity, performance (indexes/queries) and traceability.",
        ].join("\n"),
      },
      {
        q: "What’s a strong impact/result you’ve delivered?",
        a: [
          "A clear example: I optimized a high-volume invoice ingestion by rewriting the reader to process ~2.5M items.",
          "Runtime dropped from ~23h to ~30min (about **46×** faster), with no cost increase.",
        ].join("\n"),
      },
      {
        q: "Do you have experience with real-time streaming (SSE/WebSocket)?",
        a: [
          "Yes. I implemented real-time streaming (SSE) and WebSocket, with chunk control, automatic fallback and safe content rendering.",
        ].join("\n"),
      },
      {
        q: "What’s your experience with OCR and extracting data from PDFs/images?",
        a: [
          "I built a document/image ingestion pipeline with OCR (Tesseract) + structured extraction via LLM.",
          "I also added a heuristic to detect PDFs without a text layer and used OpenAI Files API (upload/cleanup) when it made sense for efficiency/cost.",
        ].join("\n"),
      },
      {
        q: "Have you worked with Airflow, dbt, Kafka, Databricks and PySpark?",
        a: [
          "Yes — those are part of my data engineering toolkit and approach (pipelines/ETL/ELT, distributed processing and integrations).",
          "In practice I have worked with tools and concepts like PySpark, Hadoop, Databricks, dbt, Kafka and Airflow.",
        ].join("\n"),
      },
      {
        q: "What’s your education and English level?",
        a: [
          "I have a Computer Engineering degree (FURG), completed in Mar/2025, and I’m currently pursuing an MBA in Data Engineering (FIAP).",
          "English: advanced.",
        ].join("\n"),
      },
    ]
    return language === "pt" ? pt : en
  }, [language])

  const askInChat = (question: string) => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent("tn-chat-ask", { detail: { question } }))
  }

  const simulateFaqInChat = (question: string, answer: string) => {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent("tn-chat-faq", { detail: { question, answer } }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8">
      <div className="mb-8 text-center sm:mb-12">
        <h1 className="mb-3 font-mono text-3xl font-bold tracking-tight text-balance sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
          {t("homeTitle")}
        </h1>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">{t("homeSubtitle")}</p>
      </div>

      {/* 3 columns: left sidebar, centered chat, right spacer (keeps chat centered) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_56rem_1fr] lg:items-start">
        {/* Left sidebar */}
        <div className="order-2 lg:order-1 hidden lg:flex lg:justify-end">
          {/* Sidebar colapsa horizontalmente com a borda direita fixa (em direção ao chat) */}
          <div
            className={`ml-auto transition-[width] duration-200 ease-in-out ${
              isFaqOpen ? "w-[360px]" : "w-12"
            }`}
          >
            <Card className="h-full overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b p-3">
                <div className="flex min-w-0 items-center gap-2">
                  {isFaqOpen ? (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t("commonQuestionsTitle")}</div>
                      <div className="truncate text-xs text-muted-foreground">{t("commonQuestionsSubtitle")}</div>
                    </div>
                  ) : (
                    <div
                      className="text-xs font-semibold text-muted-foreground"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                      {t("commonQuestionsTitle")}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setIsFaqOpen((v) => !v)}
                  title={isFaqOpen ? (language === "pt" ? "Ocultar" : "Hide") : (language === "pt" ? "Mostrar" : "Show")}
                >
                  {isFaqOpen ? (language === "pt" ? "«" : "«") : (language === "pt" ? "»" : "»")}
                </Button>
              </div>

              {isFaqOpen && (
                <div className="space-y-3 p-4">
                  {commonQuestions.map((item) => (
                    <Button
                      key={item.q}
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-start whitespace-normal text-left leading-snug"
                      onClick={() => simulateFaqInChat(item.q, item.a)}
                    >
                      {item.q}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Center chat */}
        <div className="order-1 lg:order-2">
          {/* Mantém a mesma largura do layout antigo (max-w-4xl) */}
          <div className="mx-auto w-full max-w-4xl">
            <ChatInterface />
          </div>
        </div>

        {/* Right spacer */}
        <div className="order-3 hidden lg:block" />
      </div>

      {/* Mobile: FAQ abaixo do chat */}
      <div className="mt-8 lg:hidden">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t("commonQuestionsTitle")}</div>
              <div className="text-xs text-muted-foreground">{t("commonQuestionsSubtitle")}</div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFaqOpen((v) => !v)}>
              {isFaqOpen ? (language === "pt" ? "Ocultar" : "Hide") : (language === "pt" ? "Mostrar" : "Show")}
            </Button>
          </div>
          {isFaqOpen && (
            <div className="mt-4 space-y-3">
              {commonQuestions.map((item) => (
                <Button
                  key={item.q}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start whitespace-normal text-left leading-snug"
                  onClick={() => simulateFaqInChat(item.q, item.a)}
                >
                  {item.q}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
