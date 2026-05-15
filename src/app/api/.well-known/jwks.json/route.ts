import { NextResponse } from 'next/server'

import { getPublicJwk } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

export async function GET() {
  const jwk = await getPublicJwk()
  return NextResponse.json(
    { keys: [jwk] },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
