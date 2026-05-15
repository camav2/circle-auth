'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export type BrandConfig = {
  name: string
  logoUrl: string
  primaryColor: string
  nonMemberCtaLabel: string
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'sent' }
  | { status: 'not_member'; message: string; redirectUrl: string; ctaLabel: string }
  | { status: 'error'; message: string }

export function LoginForm({ brand }: { brand: BrandConfig }) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? ''
  const appName = searchParams.get('app_name') ?? brand.name
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>(
    error === 'invalid_token'
      ? {
          status: 'error',
          message:
            'That sign-in link has expired or already been used. Please request a new one.',
        }
      : { status: 'idle' },
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState({ status: 'loading' })

    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          redirect: redirect || undefined,
          appName: appName !== brand.name ? appName : undefined,
        }),
      })

      const data = await res.json()

      if (data.notMember) {
        setState({
          status: 'not_member',
          message: data.message,
          redirectUrl: data.redirectUrl,
          ctaLabel: data.ctaLabel ?? brand.nonMemberCtaLabel,
        })
        return
      }

      if (data.sent) {
        setState({ status: 'sent' })
        return
      }

      setState({ status: 'error', message: data.error ?? 'Something went wrong. Please try again.' })
    } catch {
      setState({ status: 'error', message: 'Network error. Please try again.' })
    }
  }

  const btnStyle = {
    backgroundColor: brand.primaryColor,
  } as React.CSSProperties

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
        <div className="mb-8 flex justify-center">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="h-16 object-contain" />
          ) : (
            <span className="text-xl font-bold text-gray-900">{brand.name}</span>
          )}
        </div>

        {state.status === 'sent' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                ✉️
              </span>
            </div>
            <h1 className="mb-2 text-xl font-semibold text-gray-900">Check your email</h1>
            <p className="text-sm text-gray-500">
              We sent a sign-in link to{' '}
              <strong className="text-gray-700">{email}</strong>. It expires in 15 minutes.
            </p>
            <button
              className="mt-6 text-sm text-blue-600 hover:underline"
              onClick={() => setState({ status: 'idle' })}
            >
              Use a different email
            </button>
          </div>
        )}

        {state.status === 'not_member' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
                👋
              </span>
            </div>
            <h1 className="mb-3 text-xl font-semibold text-gray-900">Not a member yet?</h1>
            <p className="mb-6 text-sm leading-relaxed text-gray-500">{state.message}</p>
            {state.redirectUrl && (
              <a
                href={state.redirectUrl}
                className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                style={btnStyle}
              >
                {state.ctaLabel} →
              </a>
            )}
            <button
              className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600 hover:underline"
              onClick={() => setState({ status: 'idle' })}
            >
              Try a different email
            </button>
          </div>
        )}

        {(state.status === 'idle' ||
          state.status === 'loading' ||
          state.status === 'error') && (
          <>
            <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">
              Sign in to {appName}
            </h1>
            <p className="mb-8 text-center text-sm text-gray-500">
              Enter your email and we&apos;ll send you a sign-in link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {state.status === 'error' && (
                <p className="text-sm text-red-500">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={state.status === 'loading'}
                className="rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={btnStyle}
              >
                {state.status === 'loading' ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
