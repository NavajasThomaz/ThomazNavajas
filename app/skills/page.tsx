import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Cloud, Code, Wrench, BarChart3, GitBranch } from "lucide-react"

const skillCategories = [
  {
    title: "Programming Languages",
    icon: Code,
    skills: [
      { name: "Python", level: 95 },
      { name: "SQL", level: 95 },
      { name: "Scala", level: 80 },
      { name: "Java", level: 75 },
      { name: "Bash", level: 85 },
    ],
  },
  {
    title: "Big Data Technologies",
    icon: Database,
    skills: [
      { name: "Apache Spark", level: 90 },
      { name: "Apache Kafka", level: 85 },
      { name: "Apache Airflow", level: 90 },
      { name: "Hadoop", level: 75 },
      { name: "Flink", level: 70 },
    ],
  },
  {
    title: "Cloud Platforms",
    icon: Cloud,
    skills: [
      { name: "AWS (S3, Redshift, Glue, EMR)", level: 90 },
      { name: "GCP (BigQuery, Dataflow)", level: 85 },
      { name: "Azure (Synapse, Data Factory)", level: 80 },
      { name: "Snowflake", level: 85 },
    ],
  },
  {
    title: "Databases",
    icon: Database,
    skills: [
      { name: "PostgreSQL", level: 90 },
      { name: "MongoDB", level: 85 },
      { name: "Cassandra", level: 75 },
      { name: "Redis", level: 80 },
      { name: "Elasticsearch", level: 75 },
    ],
  },
  {
    title: "DevOps & Tools",
    icon: Wrench,
    skills: [
      { name: "Docker", level: 90 },
      { name: "Kubernetes", level: 80 },
      { name: "Terraform", level: 85 },
      { name: "Git", level: 95 },
      { name: "CI/CD", level: 85 },
    ],
  },
  {
    title: "Data Tools",
    icon: BarChart3,
    skills: [
      { name: "DBT", level: 90 },
      { name: "Tableau", level: 80 },
      { name: "Looker", level: 75 },
      { name: "Great Expectations", level: 85 },
      { name: "Pandas", level: 95 },
    ],
  },
]

const certifications = [
  "AWS Certified Data Analytics - Specialty",
  "Google Professional Data Engineer",
  "Databricks Certified Associate Developer",
  "Apache Kafka Certified Developer",
]

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Technical Skills</h1>
        <p className="text-lg text-muted-foreground text-pretty">
          {"Comprehensive expertise across the modern data engineering stack."}
        </p>
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
                <h3 className="text-xl font-semibold">{category.title}</h3>
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

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-accent/10 p-2">
            <GitBranch className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-xl font-semibold">Certifications</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert, index) => (
            <Badge key={index} variant="secondary" className="py-2 px-4">
              {cert}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}
