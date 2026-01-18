"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const projects = [
  {
    isPrivate: false,
    title: "Portfólio Profissional",
    titleEn: "Professional Portfolio",
    description:
      "Portfólio interativo desenvolvido com Next.js, React e TypeScript, apresentando experiência em engenharia de dados e IA. Interface moderna com suporte a múltiplos idiomas (PT/EN), tema claro/escuro e chatbot integrado com LangChain.",
    descriptionEn:
      "Interactive portfolio developed with Next.js, React and TypeScript, showcasing experience in data engineering and AI. Modern interface with multi-language support (PT/EN), light/dark theme and integrated chatbot with LangChain.",
    impact: "Portfólio profissional moderno e responsivo com experiência de usuário otimizada",
    impactEn: "Modern and responsive professional portfolio with optimized user experience",
    technologies: ["Next.js", "React", "TypeScript", "TailwindCSS", "LangChain"],
    metrics: ["Next.js 16", "TypeScript", "Responsive"],
    metricsEn: ["Next.js 16", "TypeScript", "Responsive"],
    githubUrl: "https://github.com/NavajasThomaz/ThomazNavajas",
  },
  {
    isPrivate: false,
    title: "Lakehouse Spark Delta Enterprise Portfolio",
    titleEn: "Lakehouse Spark Delta Enterprise Portfolio",
    description:
      "Lakehouse de nível enterprise local com camadas Bronze/Silver/Gold usando Apache Spark + Delta Lake. Ingestão multi-fonte, upserts CDC, verificações de qualidade de dados e outputs Gold para BI/ML.",
    descriptionEn:
      "Enterprise-style local Lakehouse with Bronze/Silver/Gold layers using Apache Spark + Delta Lake. Multi-source ingestion, CDC upserts, data quality checks and Gold BI/ML outputs.",
    impact: "Arquitetura Lakehouse completa para processamento de dados em escala enterprise",
    impactEn: "Complete Lakehouse architecture for enterprise-scale data processing",
    technologies: ["Python", "Apache Spark", "Delta Lake", "PySpark", "ETL/ELT"],
    metrics: ["Bronze/Silver/Gold", "Delta Lake", "CDC Upserts"],
    metricsEn: ["Bronze/Silver/Gold", "Delta Lake", "CDC Upserts"],
    githubUrl: "https://github.com/NavajasThomaz/lakehouse-spark-delta-enterprise-portfolio",
  },
  {
    isPrivate: false,
    title: "EPROC TJMG - Web Scraper de Processos Judiciais",
    titleEn: "EPROC TJMG - Judicial Process Web Scraper",
    description:
      "Script para captura automatizada de dados de processos judiciais do sistema eproc do TJMG utilizando Selenium WebDriver. Extração estruturada de informações jurídicas para análise e processamento.",
    descriptionEn:
      "Script for automated capture of judicial process data from the TJMG eproc system using Selenium WebDriver. Structured extraction of legal information for analysis and processing.",
    impact: "Automação de coleta de dados jurídicos com alta precisão e confiabilidade",
    impactEn: "Automation of legal data collection with high accuracy and reliability",
    technologies: ["Python", "Selenium", "WebDriver", "Web Scraping"],
    metrics: ["Selenium", "Web Scraping", "Automated"],
    metricsEn: ["Selenium", "Web Scraping", "Automated"],
    githubUrl: "https://github.com/NavajasThomaz/EPROC_TJMG-Web_Scraper_de_Processos_Judiciais",
  },
  {
    isPrivate: false,
    title: "Distributed Data Analysis with Databricks",
    titleEn: "Distributed Data Analysis with Databricks",
    description:
      "Análise de dados distribuída utilizando Databricks. Notebook carrega CSV diretamente do repositório, demonstrando capacidades de processamento distribuído e análise de grandes volumes de dados.",
    descriptionEn:
      "Distributed data analysis using Databricks. Notebook loads CSV directly from repository, demonstrating distributed processing capabilities and large-scale data analysis.",
    impact: "Processamento distribuído eficiente de grandes volumes de dados em ambiente cloud",
    impactEn: "Efficient distributed processing of large data volumes in cloud environment",
    technologies: ["Python", "Databricks", "PySpark", "Jupyter", "Cloud"],
    metrics: ["Databricks", "PySpark", "Distributed"],
    metricsEn: ["Databricks", "PySpark", "Distributed"],
    githubUrl: "https://github.com/NavajasThomaz/Distributed_data_analysis_with_Databricks",
  },
  {
    isPrivate: false,
    title: "Scikit-Learn Tutorial",
    titleEn: "Scikit-Learn Tutorial",
    description:
      "Tutorial completo de Scikit-learn, biblioteca Python de código aberto que fornece ferramentas simples e eficientes para machine learning e análise de dados. Amplamente utilizado por cientistas de dados e engenheiros de ML.",
    descriptionEn:
      "Complete Scikit-learn tutorial, an open-source Python library providing simple and efficient tools for machine learning and data analysis. Widely used by data scientists and ML engineers.",
    impact: "Material educativo completo para aprendizado de machine learning com Scikit-learn",
    impactEn: "Complete educational material for learning machine learning with Scikit-learn",
    technologies: ["Python", "Scikit-learn", "Machine Learning", "Jupyter"],
    metrics: ["Scikit-learn", "ML Tutorial", "Jupyter"],
    metricsEn: ["Scikit-learn", "ML Tutorial", "Jupyter"],
    githubUrl: "https://github.com/NavajasThomaz/Scikit-Learn-Tutorial",
  },
  {
    isPrivate: false,
    title: "TumorVision",
    titleEn: "TumorVision",
    description:
      "Software de visualização e análise para diagnósticos de tumores utilizando técnicas de inteligência artificial. Processamento de imagens médicas com ferramentas avançadas de visão computacional.",
    descriptionEn:
      "Visualization and analysis software for tumor diagnoses using artificial intelligence techniques. Medical image processing with advanced computer vision tools.",
    impact: "Ferramenta de apoio ao diagnóstico médico com IA para análise de tumores",
    impactEn: "Medical diagnostic support tool with AI for tumor analysis",
    technologies: ["Python", "OpenCV", "TensorFlow", "Computer Vision", "AI"],
    metrics: ["OpenCV", "TensorFlow", "Computer Vision"],
    metricsEn: ["OpenCV", "TensorFlow", "Computer Vision"],
    githubUrl: "https://github.com/NavajasThomaz/TumorVision",
  },
  {
    isPrivate: false,
    title: "OpenGL C3",
    titleEn: "OpenGL C3",
    description:
      "Projeto OpenGL utilizando GLFW e OpenGL.GL.shaders para visualização de escadaria C3. Demonstração de programação gráfica 3D e renderização avançada com OpenGL.",
    descriptionEn:
      "OpenGL project using GLFW and OpenGL.GL.shaders for C3 staircase visualization. Demonstration of 3D graphics programming and advanced rendering with OpenGL.",
    impact: "Visualização 3D interativa demonstrando habilidades em programação gráfica",
    impactEn: "Interactive 3D visualization demonstrating graphics programming skills",
    technologies: ["Python", "OpenGL", "GLFW", "3D Graphics", "Shaders"],
    metrics: ["OpenGL", "GLFW", "3D Graphics"],
    metricsEn: ["OpenGL", "GLFW", "3D Graphics"],
    githubUrl: "https://github.com/NavajasThomaz/OpenGL_C3",
  },
  {
    isPrivate: false,
    title: "Cloud-Verse",
    titleEn: "Cloud-Verse",
    description:
      "Projeto em Python focado em soluções de cloud computing. Demonstração de integração com serviços em nuvem e arquiteturas distribuídas com foco em escalabilidade e performance.",
    descriptionEn:
      "Python project focused on cloud computing solutions. Demonstration of cloud service integration and distributed architectures with focus on scalability and performance.",
    impact: "Soluções de cloud computing escaláveis e eficientes",
    impactEn: "Scalable and efficient cloud computing solutions",
    technologies: ["Python", "Cloud Computing", "AWS", "Azure", "GCP"],
    metrics: ["Cloud Computing", "Multi-cloud", "Python"],
    metricsEn: ["Cloud Computing", "Multi-cloud", "Python"],
    githubUrl: "https://github.com/NavajasThomaz/Cloud-Verse",
  },
]

export default function ProjectsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("featuredProjects")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("projectsSubtitle")}</p>
      </div>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <Card key={index} className="p-6">
            <h3 className="mb-3 text-2xl font-semibold">{language === "pt" ? project.title : project.titleEn}</h3>

            <p className="mb-4 leading-relaxed text-muted-foreground">
              {language === "pt" ? project.description : project.descriptionEn}
            </p>

            <div className="mb-4 rounded-lg bg-accent/10 p-4">
              <h4 className="mb-2 text-sm font-semibold text-accent">{t("impact")}</h4>
              <p className="text-sm leading-relaxed">{language === "pt" ? project.impact : project.impactEn}</p>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-4">
              {(language === "pt" ? project.metrics : project.metricsEn).map((metric, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold text-primary">{metric}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <Badge key={i} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>

            {!project.isPrivate && (
              <div className="flex gap-2">
                {project.githubUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      {t("viewCode")}
                    </a>
                  </Button>
                )}
                {project.demoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t("liveDemo")}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
