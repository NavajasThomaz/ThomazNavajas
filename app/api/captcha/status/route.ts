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

function verifyCookie(value: string | undefined) {
  const secret = getSecret()
  if (!secret) return false
  if (!value) return false
  const parts = value.split(".")
  if (parts.length !== 2) return false
  const [tsRaw, sig] = parts
  const ts = Number(tsRaw)
  if (!Number.isFinite(ts) || ts <= 0) return false
  const now = Math.floor(Date.now() / 1000)
  if (now - ts > TTL_SECONDS) return false
  const expected = crypto.createHmac("sha256", secret).update(tsRaw).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function GET() {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  const ok = verifyCookie(raw)
  return NextResponse.json({ ok }, { status: 200 })
}

