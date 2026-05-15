import { NextRequest, NextResponse } from 'next/server'

import { consumeMagicToken } from '@/lib/redis'
import { signSession } from '@/lib/jwt'
import { env } from '@/lib/env'

function isSafeRedirect(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false

    // If no allowlist is configured, permit any HTTPS URL (useful for dev/self-hosted)
    if (env.allowedRedirectOrigins.length === 0) return true

    return env.allowedRedirectOrigins.some((origin) => {
      try {
        const allowed = new URL(origin)
        return (
          parsed.origin === allowed.origin ||
          parsed.hostname.endsWith('.' + allowed.hostname)
        )
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const token = searchParams.get('token')
  const redirectParam = searchParams.get('redirect')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', env.magicLink.baseUrl))
  }

  const payload = await consumeMagicToken(token)

  if (!payload) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', env.magicLink.baseUrl))
  }

  const jwt = await signSession({
    sub: payload.email,
    circleUserId: payload.circleUserId,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
  })

  const safeRedirect = redirectParam && isSafeRedirect(redirectParam) ? redirectParam : null

  // Build destination — attach token as query param for cross-domain apps
  let destination: string
  if (safeRedirect) {
    const dest = new URL(safeRedirect)
    dest.searchParams.set('token', jwt)
    dest.searchParams.set('expires_in', String(env.jwt.ttlSeconds))
    destination = dest.toString()
  } else {
    destination = env.magicLink.baseUrl
  }

  const response = NextResponse.redirect(destination)

  // Also set a cookie so same-domain apps can use /api/me without a Bearer header
  response.cookies.set(env.cookie.name, jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
    maxAge: env.jwt.ttlSeconds,
  })

  return response
}
