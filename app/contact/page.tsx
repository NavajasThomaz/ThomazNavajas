"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Linkedin, Github, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useState, FormEvent } from "react"

export default function ContactPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { name, email, subject, message } = formData

    if (!name.trim() || !email.trim() || !message.trim()) {
      return
    }

    const emailSubject = subject.trim() || "Contato do Portfólio"
    const emailBody = `Olá Thomaz,

Meu nome é ${name.trim()}${email.trim() ? ` (${email.trim()})` : ""}.

${message.trim()}`

    const mailtoLink = `mailto:thomaznavajas@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

    window.location.href = mailtoLink
  }

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">{t("getInTouch")}</h1>
        <p className="text-lg text-muted-foreground text-pretty">{t("contactSubtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">{t("contactInformation")}</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">{t("email")}</div>
                  <div className="text-sm text-muted-foreground">thomaznavajas@gmail.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">{t("location")}</div>
                  <div className="text-sm text-muted-foreground">São Paulo, Brasil</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">{t("socialLinks")}</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <a href="https://linkedin.com/in/thomaz-navajas" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" />
                  LinkedIn
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                <a href="https://github.com/NavajasThomaz" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-6 text-xl font-semibold">{t("sendMessage")}</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  {t("name")}
                </label>
                <Input
                  id="name"
                  placeholder={t("namePlaceholder")}
                  value={formData.name}
                  onChange={handleChange("name")}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  {t("email")}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium">
                {t("subject")}
              </label>
              <Input
                id="subject"
                placeholder={t("subjectPlaceholder")}
                value={formData.subject}
                onChange={handleChange("subject")}
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium">
                {t("message")}
              </label>
              <Textarea
                id="message"
                placeholder={t("messagePlaceholder")}
                rows={6}
                value={formData.message}
                onChange={handleChange("message")}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {t("sendMessageButton")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
