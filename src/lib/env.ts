const required = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  circle: {
    adminV2Url: process.env.CIRCLE_ADMIN_V2_URL ?? 'https://app.circle.so/api/admin/v2',
    adminV2Token: required('CIRCLE_ADMIN_V2_TOKEN'),
    communityId: required('CIRCLE_COMMUNITY_ID'),
  },
  resend: {
    apiKey: required('RESEND_API_KEY'),
    fromEmail: required('RESEND_FROM_EMAIL'),
  },
  redis: {
    url: required('UPSTASH_REDIS_REST_URL'),
    token: required('UPSTASH_REDIS_REST_TOKEN'),
  },
  jwt: {
    privateKey: required('JWT_PRIVATE_KEY'),
    keyId: process.env.JWT_KEY_ID ?? 'circle-auth-1',
    ttlSeconds: parseInt(process.env.JWT_TTL_SECONDS ?? '604800', 10),
  },
  magicLink: {
    baseUrl: required('AUTH_BASE_URL'),
    ttlSeconds: parseInt(process.env.MAGIC_LINK_TTL_SECONDS ?? '900', 10),
  },
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'My Community',
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL ?? '',
    primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR ?? '#2563eb',
    footerText: process.env.NEXT_PUBLIC_BRAND_FOOTER_TEXT ?? '',
  },
  nonMember: {
    redirectUrl: process.env.NON_MEMBER_REDIRECT_URL ?? '',
    message:
      process.env.NON_MEMBER_MESSAGE ??
      "We couldn't find a membership for that email address.",
    ctaLabel: process.env.NON_MEMBER_CTA_LABEL ?? 'Learn more',
  },
  allowedRedirectOrigins: (process.env.ALLOWED_REDIRECT_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cookie: {
    name: process.env.AUTH_COOKIE_NAME ?? 'circle_session',
    domain: process.env.AUTH_COOKIE_DOMAIN ?? undefined,
  },
}
