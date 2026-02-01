"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Calendar } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { experiences } from "@/lib/experience-data"

export default function ExperiencePage() {
  const { t, language } = useLanguage()

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("experienceTitle")}</h1>
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
