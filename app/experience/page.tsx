"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const experiences = [
  {
    title: "Desenvolvedor de IA Pleno",
    titleEn: "Senior AI Developer",
    company: "Allcom Telecom",
    period: "05/2025 - Atual",
    periodEn: "May 2025 - Present",
    location: "São Paulo, Brasil (Híbrido)",
    locationEn: "São Paulo, Brazil (Hybrid)",
    description:
      "Arquitetura e entrega de plataforma de chatbot com LangChain (RAG, tool calling), Python, FastAPI, MongoDB, Selenium e SLMs locais via Ollama.",
    descriptionEn:
      "Architecture and delivery of chatbot platform with LangChain (RAG, tool calling), Python, FastAPI, MongoDB, Selenium and local SLMs via Ollama.",
    achievements: [
      "Pipeline de chat conversacional com preferências por usuário, memória por chat em MongoDB e suporte a tool-calls recursivas em streaming",
      "Agente de Suporte N1 com análise básica e avançada, incluindo cruzamento de dados com imagens satelitais e contexto geoespacial",
      "Uploads seguros de imagens/documentos com normalização, armazenamento base64 e geração automática de descrição via OCR + LLM",
      "Agente de recomendação de produtos com RAG + Regex, atingindo 80–100% de precisão em conjuntos avaliados",
      "Otimização de ingestão de faturas em alto volume: reescrita de leitor (~1,5M itens) de ~23h para ~30min (~46× mais rápido) sem aumento de custo",
    ],
    achievementsEn: [
      "Conversational chat pipeline with user preferences, chat memory in MongoDB and support for recursive tool-calls in streaming",
      "N1 Support Agent with basic and advanced analysis, including data cross-referencing with satellite images and geospatial context",
      "Secure image/document uploads with normalization, base64 storage and automatic description generation via OCR + LLM",
      "Product recommendation agent with RAG + Regex, achieving 80–100% accuracy in evaluated sets",
      "High-volume invoice ingestion optimization: reader rewrite (~1.5M items) from ~23h to ~30min (~46× faster) without cost increase",
    ],
    technologies: [
      "Python",
      "FastAPI",
      "LangChain",
      "MongoDB",
      "Ollama",
      "RAG",
      "Selenium",
      "PostgreSQL",
      "ETL/ELT",
    ],
  },
  {
    title: "Pesquisador de IC em IA",
    titleEn: "AI Research Assistant",
    company: "Universidade Federal (C3/FURG)",
    period: "08/2023 - 05/2024",
    periodEn: "Aug 2023 - May 2024",
    location: "Remoto",
    locationEn: "Remote",
    description:
      "Pesquisa em GNNs com aprendizado contrastivo espaço-temporal para recomendação por sessão usando TensorFlow/PyTorch, RecBole, cuDF/CUDA e Pandas.",
    descriptionEn:
      "Research on GNNs with spatiotemporal contrastive learning for session-based recommendation using TensorFlow/PyTorch, RecBole, cuDF/CUDA and Pandas.",
    achievements: [
      "Desenvolvimento de GNNs com aprendizado contrastivo espaço-temporal para recomendação por sessão",
      "Pipelines reprodutíveis de treino/avaliação no Google Colab",
      "Uso de cuDF/CUDA para aceleração de processamento em GPUs",
    ],
    achievementsEn: [
      "Development of GNNs with spatiotemporal contrastive learning for session-based recommendation",
      "Reproducible training/evaluation pipelines on Google Colab",
      "Use of cuDF/CUDA for GPU processing acceleration",
    ],
    technologies: ["Python", "TensorFlow", "PyTorch", "GNNs", "RecBole", "CUDA", "cuDF", "Pandas"],
  },
  {
    title: "Estagiário — Desenvolvimento de IA/Software",
    titleEn: "Intern — AI/Software Development",
    company: "Radio Memory",
    period: "04/2021 - 09/2022",
    periodEn: "Apr 2021 - Sep 2022",
    location: "Remoto",
    locationEn: "Remote",
    description:
      "Desenvolvimento de recursos web/3D com VTK.js/Three.js, Node.js, PHP, Vue e integrações AWS (Lambda, webhooks).",
    descriptionEn:
      "Development of web/3D features with VTK.js/Three.js, Node.js, PHP, Vue and AWS integrations (Lambda, webhooks).",
    achievements: [
      "Desenvolvimento de recursos web/3D com VTK.js e Three.js",
      "Automações e análises em Python com OpenCV, Matplotlib, Keras/TensorFlow para POCs de IA",
      "Integrações AWS com Lambda e webhooks",
    ],
    achievementsEn: [
      "Development of web/3D features with VTK.js and Three.js",
      "Automations and analyses in Python with OpenCV, Matplotlib, Keras/TensorFlow for AI POCs",
      "AWS integrations with Lambda and webhooks",
    ],
    technologies: ["Python", "Node.js", "PHP", "Vue", "VTK.js", "Three.js", "OpenCV", "TensorFlow", "AWS"],
  },
  {
    title: "Estagiário — Prototipação em IA",
    titleEn: "Intern — AI Prototyping",
    company: "Augen",
    period: "04/2022 - 06/2022",
    periodEn: "Apr 2022 - Jun 2022",
    location: "Presencial",
    locationEn: "On-site",
    description:
      "Prototipagem de visão computacional com Python, OpenCV, Keras/TensorFlow e hardware: Arduino, ESP32-CAM, Raspberry Pi.",
    descriptionEn:
      "Computer vision prototyping with Python, OpenCV, Keras/TensorFlow and hardware: Arduino, ESP32-CAM, Raspberry Pi.",
    achievements: [
      "Prototipagem de visão computacional com Python e OpenCV",
      "Desenvolvimento de GUIs simples com tkinter",
      "Scripts de coleta e processamento com NumPy e requests",
    ],
    achievementsEn: [
      "Computer vision prototyping with Python and OpenCV",
      "Simple GUI development with tkinter",
      "Collection and processing scripts with NumPy and requests",
    ],
    technologies: ["Python", "OpenCV", "TensorFlow", "Keras", "Arduino", "ESP32-CAM", "Raspberry Pi", "NumPy"],
  },
  {
    title: "Instrutor de Programação & Robótica",
    titleEn: "Programming & Robotics Instructor",
    company: "SuperGeeks Itaim",
    period: "10/2021 - 04/2022",
    periodEn: "Oct 2021 - Apr 2022",
    location: "Presencial",
    locationEn: "On-site",
    description:
      "Instrutor de C#, C++, Arduino, Unity/Unreal (trilha 264h). Comunicação técnica e didática.",
    descriptionEn: "Instructor of C#, C++, Arduino, Unity/Unreal (264h track). Technical and didactic communication.",
    achievements: [
      "Instrutoria de programação em C#, C++, Arduino",
      "Ensino de game development com Unity e Unreal Engine",
      "Trilha completa de 264 horas de ensino",
    ],
    achievementsEn: [
      "Programming instruction in C#, C++, Arduino",
      "Game development teaching with Unity and Unreal Engine",
      "Complete 264-hour teaching track",
    ],
    technologies: ["C#", "C++", "Arduino", "Unity", "Unreal Engine"],
  },
]

export default function ExperiencePage() {
  const { t, language } = useLanguage()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("workExperience")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("experienceSubtitle")}</p>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <Card key={index} className="p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">{language === "pt" ? exp.title : exp.titleEn}</h3>
                </div>
                <p className="text-lg text-muted-foreground">{exp.company}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "pt" ? exp.location : exp.locationEn}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{language === "pt" ? exp.period : exp.periodEn}</span>
              </div>
            </div>

            <p className="mb-4 leading-relaxed text-muted-foreground">
              {language === "pt" ? exp.description : exp.descriptionEn}
            </p>

            <div className="mb-4">
              <h4 className="mb-2 font-semibold">{t("keyAchievements")}</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {(language === "pt" ? exp.achievements : exp.achievementsEn).map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              {exp.technologies.map((tech, i) => (
                <Badge key={i} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
