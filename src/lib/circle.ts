import { env } from './env'

export type CircleMember = {
  email: string
  name: string
  avatarUrl: string
  userId: number
  active: boolean
}

export async function findCircleMember(email: string): Promise<CircleMember | null> {
  const url = `${env.circle.adminV2Url}/community_members/search?email=${encodeURIComponent(email)}&community_id=${env.circle.communityId}`

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.circle.adminV2Token}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url ?? '',
    userId: data.user_id,
    active: data.active ?? true,
  }
}
