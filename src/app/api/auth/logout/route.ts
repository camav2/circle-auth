import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(env.cookie.name, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
    maxAge: 0,
  })
  return response
}

function buildLoginUrl(req: NextRequest): URL {
  const redirect = req.nextUrl.searchParams.get('redirect')
  const loginUrl = new URL('/login', req.url)
  if (redirect) loginUrl.searchParams.set('redirect', redirect)
  return loginUrl
}

export async function GET(req: NextRequest) {
  return clearSessionCookie(NextResponse.redirect(buildLoginUrl(req)))
}

export async function POST(req: NextRequest) {
  return clearSessionCookie(NextResponse.redirect(buildLoginUrl(req)))
}
