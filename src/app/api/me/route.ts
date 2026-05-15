import { NextRequest, NextResponse } from 'next/server'

import { verifySession } from '@/lib/jwt'
import { env } from '@/lib/env'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  // Accept token from cookie (same-domain) or Authorization header (cross-domain)
  const cookieToken = req.cookies.get(env.cookie.name)?.value
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const token = cookieToken ?? bearerToken ?? null

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: CORS_HEADERS })
  }

  const session = await verifySession(token)

  if (!session) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    {
      email: session.sub,
      circleUserId: session.circleUserId,
      name: session.name,
      avatarUrl: session.avatarUrl,
    },
    { headers: CORS_HEADERS },
  )
}
