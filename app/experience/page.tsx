import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"

const experiences = [
  {
    title: "Senior Data Engineer",
    company: "Tech Corp",
    period: "2021 - Present",
    description:
      "Leading data infrastructure initiatives and mentoring junior engineers. Architected real-time data processing systems handling millions of events per day.",
    achievements: [
      "Reduced data processing latency by 60% through optimization",
      "Built automated monitoring system for data quality",
      "Led migration to cloud-native data architecture",
    ],
    technologies: ["Apache Spark", "Kafka", "AWS", "Python", "Airflow"],
  },
  {
    title: "Data Engineer",
    company: "DataCo",
    period: "2019 - 2021",
    description: "Developed and maintained ETL pipelines supporting analytics and business intelligence initiatives.",
    achievements: [
      "Designed data warehouse schema supporting 50+ dashboards",
      "Automated data quality checks reducing errors by 75%",
      "Implemented CI/CD for data pipeline deployments",
    ],
    technologies: ["PostgreSQL", "DBT", "Python", "Docker", "Tableau"],
  },
  {
    title: "Junior Data Engineer",
    company: "Analytics Inc",
    period: "2018 - 2019",
    description: "Built ETL processes and contributed to data infrastructure projects.",
    achievements: [
      "Developed Python scripts for data extraction and transformation",
      "Created data validation frameworks",
      "Collaborated on data warehouse design",
    ],
    technologies: ["Python", "SQL", "Hadoop", "MongoDB"],
  },
]

export default function ExperiencePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Work Experience</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {
            "My professional journey in data engineering, building scalable systems and driving data-driven decision making."
          }
        </p>
      </div>

      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <Card key={index} className="p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">{exp.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground">{exp.company}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{exp.period}</span>
              </div>
            </div>

            <p className="mb-4 leading-relaxed text-muted-foreground">{exp.description}</p>

            <div className="mb-4">
              <h4 className="mb-2 font-semibold">Key Achievements:</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {exp.achievements.map((achievement, i) => (
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
