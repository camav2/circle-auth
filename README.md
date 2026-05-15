# circle-auth

Magic-link authentication for Circle communities. Your members sign in with their community email — no separate accounts, no passwords. Works with any number of downstream apps or tools.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2Fcircle-auth&env=CIRCLE_ADMIN_V2_TOKEN,CIRCLE_COMMUNITY_ID,RESEND_API_KEY,RESEND_FROM_EMAIL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,JWT_PRIVATE_KEY,AUTH_BASE_URL,NEXT_PUBLIC_BRAND_NAME)

---

## How it works

```
User enters email
  → circle-auth checks Circle API for membership
  → sends magic link via Resend
  → user clicks link → token consumed from Redis
  → RS256 JWT minted and returned
  → downstream app verifies JWT (locally via JWKS, or via /api/me)
```

The JWT is RS256-signed. Your downstream apps verify it using the public key at `/.well-known/jwks.json` — they never need to share a secret with the auth service.

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/circle-auth
cd circle-auth
npm install
```

### 2. Generate an RSA key pair

```bash
npm run generate-keys
```

Copy the printed `JWT_PRIVATE_KEY=...` line into your `.env.local`.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the required values (see `.env.example` for all options):

| Variable | Required | Notes |
|---|---|---|
| `CIRCLE_ADMIN_V2_TOKEN` | ✓ | Circle Settings → API → Admin Token |
| `CIRCLE_COMMUNITY_ID` | ✓ | Circle Settings → General |
| `RESEND_API_KEY` | ✓ | resend.com |
| `RESEND_FROM_EMAIL` | ✓ | Must be a verified Resend sender |
| `UPSTASH_REDIS_REST_URL` | ✓ | upstash.com — free tier is fine |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ | |
| `JWT_PRIVATE_KEY` | ✓ | Output of `npm run generate-keys` |
| `AUTH_BASE_URL` | ✓ | URL of this deployed service |
| `NEXT_PUBLIC_BRAND_NAME` | ✓ | Shown on login page and in emails |

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
vercel deploy
```

Or use the button at the top of this file.

---

## Integrating a downstream app

### Option A — redirect flow (recommended for web apps)

Send users to your auth service with a `redirect` param pointing back to your app's callback URL:

```
https://auth.yourdomain.com/login?redirect=https://myapp.com/auth/callback&app_name=My+App
```

After the magic link is verified, the user lands on:

```
https://myapp.com/auth/callback?token=<jwt>&expires_in=604800
```

Store the JWT (e.g. in a server-side session or `HttpOnly` cookie on your app's domain), then discard the URL token. On subsequent requests, send it as a `Bearer` header or cookie.

### Option B — verify via /api/me

```http
GET https://auth.yourdomain.com/api/me
Authorization: Bearer <jwt>
```

Returns:

```json
{
  "email": "user@example.com",
  "circleUserId": 12345,
  "name": "Jane Smith",
  "avatarUrl": "https://..."
}
```

### Option C — verify locally (no network round-trip)

Fetch the public key from `/.well-known/jwks.json` and verify the JWT in your own service using any standard JWT library that supports RS256 + JWKS.

**Node.js example with `jose`:**

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(new URL('https://auth.yourdomain.com/.well-known/jwks.json'))

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, { algorithms: ['RS256'] })
  return payload // { sub, circleUserId, name, avatarUrl, iat, exp }
}
```

**Python example with `python-jose`:**

```python
import requests
from jose import jwt

jwks = requests.get('https://auth.yourdomain.com/.well-known/jwks.json').json()
claims = jwt.decode(token, jwks, algorithms=['RS256'])
```

---

## Multi-app setup

Each downstream app just needs:
1. Your auth service URL (to redirect users to `/login`)
2. Access to `/.well-known/jwks.json` (to verify tokens independently)

You can pass `app_name` as a query param on the login URL to customise the email subject and heading per app:

```
/login?redirect=https://tool1.com/callback&app_name=AI+Writing+Coach
/login?redirect=https://tool2.com/callback&app_name=Progress+Tracker
```

To restrict which apps can receive tokens, set `ALLOWED_REDIRECT_ORIGINS`:

```
ALLOWED_REDIRECT_ORIGINS=https://tool1.com,https://tool2.com
```

If left empty, any HTTPS redirect is allowed (fine for private deployments).

---

## Security notes

- The JWT is passed as a `?token=` query param in the redirect. Store it server-side or in an `HttpOnly` cookie on your app domain immediately and strip it from the URL — don't leave it in browser history.
- Magic link tokens are single-use and expire after 15 minutes (configurable).
- The RS256 private key never leaves the auth service. Downstream apps only need the public JWKS endpoint.
- Cookie sharing across subdomains works if you set `AUTH_COOKIE_DOMAIN=.yourdomain.com`.
