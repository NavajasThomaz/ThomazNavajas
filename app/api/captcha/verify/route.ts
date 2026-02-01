import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const COOKIE_NAME = "tn_captcha"
const TTL_SECONDS = 60 * 60 * 2 // 2h

function getSecret() {
  return process.env.TURNSTILE_COOKIE_SECRET || process.env.TURNSTILE_SECRET_KEY || ""
}

function signTimestamp(ts: number) {
  const secret = getSecret()
  const tsRaw = String(ts)
  const sig = crypto.createHmac("sha256", secret).update(tsRaw).digest("hex")
  return `${tsRaw}.${sig}`
}

export async function POST(req: Request) {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ ok: false, error: "TURNSTILE_SECRET_KEY não configurado." }, { status: 500 })
    }
    const body = (await req.json().catch(() => ({}))) as { token?: string }
    const token = (body?.token || "").toString()
    if (!token) {
      return NextResponse.json({ ok: false, error: "Token ausente." }, { status: 400 })
    }

    const form = new URLSearchParams()
    form.set("secret", secretKey)
    form.set("response", token)

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    })

    const data = (await res.json().catch(() => ({}))) as { success?: boolean }
    if (!data?.success) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const now = Math.floor(Date.now() / 1000)
    const value = signTimestamp(now)
    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set({
      name: COOKIE_NAME,
      value,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TTL_SECONDS,
    })
    return response
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro ao validar captcha" }, { status: 500 })
  }
}

