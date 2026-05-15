import { Redis } from '@upstash/redis'

import { env } from './env'

export const redis = new Redis({
  url: env.redis.url,
  token: env.redis.token,
})

export type MagicLinkPayload = {
  email: string
  circleUserId: number
  name: string
  avatarUrl: string
}

const key = (token: string) => `magic:${token}`

export async function storeMagicToken(token: string, payload: MagicLinkPayload): Promise<void> {
  await redis.set(key(token), JSON.stringify(payload), { ex: env.magicLink.ttlSeconds })
}

export async function consumeMagicToken(token: string): Promise<MagicLinkPayload | null> {
  const raw = await redis.get<string>(key(token))
  if (!raw) return null
  await redis.del(key(token))
  return typeof raw === 'string' ? JSON.parse(raw) : (raw as MagicLinkPayload)
}
