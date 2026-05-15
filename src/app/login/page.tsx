import { Suspense } from 'react'

import { LoginForm } from './login-form'

export default function LoginPage() {
  const brand = {
    name: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'My Community',
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL ?? '',
    primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR ?? '#2563eb',
    nonMemberCtaLabel: process.env.NEXT_PUBLIC_NON_MEMBER_CTA_LABEL ?? 'Learn more',
  }

  return (
    <Suspense>
      <LoginForm brand={brand} />
    </Suspense>
  )
}
