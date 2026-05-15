import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { findCircleMember } from '@/lib/circle'
import { env } from '@/lib/env'
import { sendMagicLink } from '@/lib/resend'
import { storeMagicToken } from '@/lib/redis'

export async function POST(req: NextRequest) {
  const { email, redirect, appName } = await req.json()

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const normalised = email.trim().toLowerCase()

  let member
  try {
    member = await findCircleMember(normalised)
  } catch {
    return NextResponse.json(
      { error: 'Unable to verify membership. Please try again.' },
      { status: 502 },
    )
  }

  if (!member) {
    return NextResponse.json({
      notMember: true,
      message: env.nonMember.message,
      redirectUrl: env.nonMember.redirectUrl,
      ctaLabel: env.nonMember.ctaLabel,
    })
  }

  const token = randomBytes(32).toString('hex')

  await storeMagicToken(token, {
    email: member.email,
    circleUserId: member.userId,
    name: member.name,
    avatarUrl: member.avatarUrl,
  })

  const verifyUrl = new URL('/api/auth/verify', env.magicLink.baseUrl)
  verifyUrl.searchParams.set('token', token)
  if (redirect) verifyUrl.searchParams.set('redirect', redirect)

  const resolvedAppName =
    typeof appName === 'string' && appName.trim()
      ? appName.trim()
      : env.brand.name

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'Unknown'

  const city = req.headers.get('x-vercel-ip-city') ?? ''
  const country = req.headers.get('x-vercel-ip-country') ?? ''
  const region = req.headers.get('x-vercel-ip-country-region') ?? ''
  const location = [city, region, country].filter(Boolean).join(', ') || 'Unknown location'

  await sendMagicLink(member.email, verifyUrl.toString(), { ip, location, appName: resolvedAppName })

  return NextResponse.json({ sent: true })
}
