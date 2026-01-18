import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github } from "lucide-react"

const projects = [
  {
    title: "Real-time Data Pipeline",
    description:
      "Built a streaming data pipeline processing 10M+ events per day using Kafka and Spark. Implemented exactly-once semantics and automatic failure recovery.",
    impact: "Reduced data latency from hours to seconds, enabling real-time analytics",
    technologies: ["Apache Kafka", "Spark Streaming", "AWS", "Python", "Redis"],
    metrics: ["10M+ events/day", "99.9% uptime", "<5s latency"],
  },
  {
    title: "Data Warehouse Migration",
    description:
      "Led migration from on-premise Oracle database to Snowflake cloud data warehouse. Designed new data models and implemented automated ETL processes.",
    impact: "Reduced infrastructure costs by 40% and improved query performance by 3x",
    technologies: ["Snowflake", "DBT", "Airflow", "Python", "SQL"],
    metrics: ["5TB data migrated", "40% cost reduction", "3x faster queries"],
  },
  {
    title: "ML Feature Store",
    description:
      "Designed and implemented feature store infrastructure for machine learning models. Built pipelines for feature computation, storage, and serving.",
    impact: "Reduced model training time by 60% and improved feature consistency",
    technologies: ["Apache Spark", "Feast", "PostgreSQL", "Redis", "Python"],
    metrics: ["500+ features", "60% faster training", "20+ models supported"],
  },
  {
    title: "ETL Automation Framework",
    description:
      "Developed reusable ETL framework with automatic schema detection, data quality checks, and error handling. Reduced development time for new pipelines.",
    impact: "Reduced manual data processing by 80% and pipeline development time by 50%",
    technologies: ["Python", "Pandas", "Great Expectations", "Docker", "Kubernetes"],
    metrics: ["80% less manual work", "50+ pipelines created", "99% data accuracy"],
  },
]

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Featured Projects</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {"Showcasing impactful data engineering projects that solve real-world problems at scale."}
        </p>
      </div>

      <div className="grid gap-6">
        {projects.map((project, index) => (
          <Card key={index} className="p-6">
            <h3 className="mb-3 text-2xl font-semibold">{project.title}</h3>

            <p className="mb-4 leading-relaxed text-muted-foreground">{project.description}</p>

            <div className="mb-4 rounded-lg bg-accent/10 p-4">
              <h4 className="mb-2 text-sm font-semibold text-accent">Impact</h4>
              <p className="text-sm leading-relaxed">{project.impact}</p>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-4">
              {project.metrics.map((metric, i) => (
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

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Github className="mr-2 h-4 w-4" />
                View Code
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Live Demo
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
