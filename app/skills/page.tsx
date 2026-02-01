"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Database, Cloud, Code, Wrench, BrainCircuit } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type SkillCategory = {
  titlePt: string
  titleEn: string
  descriptionPt: string
  descriptionEn: string
  icon: any
  skills: string[]
}

const skillCategories: SkillCategory[] = [
  {
    titlePt: "Linguagens",
    titleEn: "Languages",
    descriptionPt: "Linguagens que uso no dia a dia (dados, APIs e automação).",
    descriptionEn: "Languages I use day-to-day (data, APIs and automation).",
    icon: Code,
    skills: ["Python", "Go", "JavaScript/Node.js", "C", "C#", "C++", "HTML/CSS"],
  },
  {
    titlePt: "Engenharia de Dados",
    titleEn: "Data Engineering",
    descriptionPt: "Pipelines, modelagem e processamento distribuído.",
    descriptionEn: "Pipelines, modeling and distributed processing.",
    icon: Database,
    skills: [
      "ETL/ELT",
      "Modelagem Bronze/Prata/Ouro",
      "SQL (MySQL, PostgreSQL)",
      "MongoDB (Motor async)",
      "SQLAlchemy (ORM)",
      "PySpark",
      "Hadoop",
      "Databricks",
      "dbt",
      "Kafka",
      "Airflow",
      "Auditoria/rastreabilidade de execuções de ETL",
      "Schemas dinâmicos (Pydantic create_model)",
      "Validação (JSON Schema Draft7)",
    ],
  },
  {
    titlePt: "IA / LLMs",
    titleEn: "AI / LLMs",
    descriptionPt: "ML clássico + LLMs com foco em extração e automação.",
    descriptionEn: "Classic ML + LLMs focused on extraction and automation.",
    icon: BrainCircuit,
    skills: [
      "scikit-learn",
      "TensorFlow",
      "PyTorch",
      "LangChain",
      "RAG",
      "Ollama (SLMs)",
      "OpenAI API (Vision + Files API)",
      "tool calling / function calling",
      "OCR (Tesseract/pytesseract)",
      "Extração estruturada (PydanticOutputParser)",
      "OpenCV",
      "PIL/Pillow",
      "CUDA/cuDF",
    ],
  },
  {
    titlePt: "APIs, Cloud & DevOps",
    titleEn: "APIs, Cloud & DevOps",
    descriptionPt: "Integrações, deploy e streaming em tempo real.",
    descriptionEn: "Integrations, deployment and real-time streaming.",
    icon: Cloud,
    skills: [
      "FastAPI",
      "Flask",
      "Docker",
      "AWS",
      "Azure",
      "GCP",
      "BigQuery",
      "Terraform",
      "Selenium",
      "WebSocket",
      "Server-Sent Events (SSE)",
      "httpx (async)",
      "OAuth2/JWT",
      "CORS",
      "webhooks",
      "cron",
    ],
  },
  {
    titlePt: "Ferramentas",
    titleEn: "Tooling",
    descriptionPt: "Bibliotecas e ferramentas que uso para produzir e manter sistemas.",
    descriptionEn: "Libraries and tools I use to build and maintain systems.",
    icon: Wrench,
    skills: ["Git", "CI/CD", "Pandas", "NumPy", "Pytest", "Jupyter", "tenacity", "Requests", "Jinja2", "python-jose", "bcrypt", "Uvicorn/Starlette", "pypdf"],
  },
]

export default function SkillsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("skillsTitle")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("skillsSubtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {skillCategories.map((category, index) => {
          const Icon = category.icon
          return (
            <Card key={index} className="relative overflow-hidden p-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" />
              <div className="relative">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{language === "pt" ? category.titlePt : category.titleEn}</h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "pt" ? category.descriptionPt : category.descriptionEn}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-muted/60">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
