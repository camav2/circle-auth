import { Resend } from 'resend'

import { env } from './env'

const resend = new Resend(env.resend.apiKey)

interface SendMagicLinkOptions {
  ip: string
  location: string
  appName: string
}

export async function sendMagicLink(
  to: string,
  magicUrl: string,
  meta: SendMagicLinkOptions,
): Promise<void> {
  const { name: brandName, logoUrl, primaryColor, footerText } = env.brand
  const year = new Date().getFullYear()
  const requestedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  })

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${brandName}" style="height: 48px; margin-bottom: 32px;" />`
    : `<p style="font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 32px;">${brandName}</p>`

  const footer = footerText || `&copy; ${year} ${brandName}`

  await resend.emails.send({
    from: env.resend.fromEmail,
    to,
    subject: `Your ${meta.appName} sign-in link`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        ${logoHtml}
        <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 12px;">Sign in to ${meta.appName}</h1>
        <p style="color: #6b7280; margin-bottom: 32px;">Click the button below to sign in. This link expires in 15 minutes and can only be used once.</p>
        <a href="${magicUrl}"
           style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; font-weight: 600;
                  padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px;">
          Sign in to ${meta.appName}
        </a>
        <p style="color: #6b7280; font-size: 13px; margin-top: 32px;">
          To protect your account, do not share this link.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #111827; font-size: 13px; font-weight: 600; margin-bottom: 8px;">Didn't request this?</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">
          This link was requested from <strong>${meta.ip}</strong>, ${meta.location} at ${requestedAt}.
          If you didn't make this request, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">${footer}</p>
      </div>
    `,
  })
}
