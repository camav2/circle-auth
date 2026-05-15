import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { verifySession } from '@/lib/jwt'
import { env } from '@/lib/env'

export default async function HomePage() {
  const token = (await cookies()).get(env.cookie.name)?.value
  const session = token ? await verifySession(token) : null

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-100 text-center">
        <p className="text-gray-500 text-sm mb-1">Signed in as</p>
        <p className="font-semibold text-gray-900">{session.name}</p>
        <p className="text-gray-400 text-sm">{session.sub}</p>
        <form action="/api/auth/logout" method="POST" className="mt-8">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
