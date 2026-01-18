"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Cloud, Code, Wrench, BarChart3, GitBranch } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const skillCategories = [
  {
    titleKey: "programmingLanguages",
    icon: Code,
    skills: [
      { name: "Python", level: 99 },
      { name: "Go", level: 70 },
      { name: "JavaScript/Node.js", level: 65 },
      { name: "TypeScript", level: 75 },
      { name: "C/C++/C#", level: 60 },
      { name: "HTML/CSS", level: 65 },
    ],
  },
  {
    titleKey: "bigDataTech",
    icon: Database,
    skills: [
      { name: "PySpark", level: 90 },
      { name: "Delta Lake", level: 85 },
      { name: "Hadoop", level: 85 },
      { name: "Databricks", level: 88 },
      { name: "Kafka", level: 80 },
      { name: "Airflow", level: 80 },
      { name: "ETL/ELT", level: 90 },
      { name: "dbt", level: 85 },
    ],
  },
  {
    titleKey: "cloudPlatforms",
    icon: Cloud,
    skills: [
      { name: "AWS", level: 85 },
      { name: "Azure", level: 80 },
      { name: "GCP", level: 80 },
      { name: "BigQuery", level: 85 },
      { name: "Terraform", level: 85 },
    ],
  },
  {
    titleKey: "databases",
    icon: Database,
    skills: [
      { name: "PostgreSQL", level: 90 },
      { name: "MySQL", level: 85 },
      { name: "MongoDB", level: 90 },
      { name: "SQL (geral)", level: 95 },
      { name: "NoSQL", level: 90 },
    ],
  },
  {
    titleKey: "devOpsTools",
    icon: Wrench,
    skills: [
      { name: "Git", level: 95 },
      { name: "CI/CD", level: 85 },
      { name: "Docker", level: 85 },
      { name: "Kubernetes", level: 75 },
      { name: "Terraform", level: 85 },
      { name: "Observabilidade", level: 80 },
    ],
  },
  {
    titleKey: "dataTools",
    icon: BarChart3,
    skills: [
      { name: "Pandas", level: 95 },
      { name: "NumPy", level: 90 },
      { name: "Matplotlib/Seaborn/Plotly", level: 85 },
      { name: "SQLAlchemy", level: 85 },
      { name: "Pytest", level: 85 },
      { name: "Selenium", level: 88 },
      { name: "Jupyter", level: 90 },
      { name: "Web Scraping", level: 85 },
    ],
  },
  {
    titleKey: "mlAiTools",
    icon: BarChart3,
    skills: [
      { name: "TensorFlow", level: 85 },
      { name: "PyTorch", level: 85 },
      { name: "LangChain", level: 90 },
      { name: "Ollama (SLMs)", level: 90 },
      { name: "scikit-learn", level: 88 },
      { name: "OpenCV", level: 88 },
      { name: "CUDA/cuDF", level: 80 },
      { name: "RAG", level: 90 },
      { name: "Computer Vision", level: 85 },
    ],
  },
  {
    titleKey: "apiTools",
    icon: Code,
    skills: [
      { name: "FastAPI", level: 90 },
      { name: "Flask", level: 85 },
      { name: "REST APIs", level: 90 },
      { name: "Next.js", level: 85 },
      { name: "React", level: 85 },
      { name: "Microsserviços", level: 85 },
      { name: "Webhooks", level: 85 },
      { name: "Celery", level: 80 },
    ],
  },
  {
    titleKey: "graphicsTools",
    icon: Code,
    skills: [
      { name: "OpenGL", level: 75 },
      { name: "GLFW", level: 75 },
      { name: "3D Graphics", level: 75 },
      { name: "Shaders", level: 70 },
    ],
  },
]

export default function SkillsPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("technicalSkills")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("skillsSubtitle")}</p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        {skillCategories.map((category, index) => {
          const Icon = category.icon
          return (
            <Card key={index} className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t(category.titleKey)}</h3>
              </div>
              <div className="space-y-4">
                {category.skills.map((skill, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
