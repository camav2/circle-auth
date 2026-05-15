import { createPublicKey } from 'crypto'
import { SignJWT, jwtVerify, importPKCS8, importSPKI, exportJWK } from 'jose'

import { env } from './env'

export type SessionPayload = {
  sub: string
  circleUserId: number
  name: string
  avatarUrl: string
}

function getPrivateKeyPem(): string {
  return Buffer.from(env.jwt.privateKey, 'base64').toString('utf-8')
}

async function getPrivateKey() {
  return importPKCS8(getPrivateKeyPem(), 'RS256')
}

async function getPublicKey() {
  const nodeKey = createPublicKey(getPrivateKeyPem())
  const spki = nodeKey.export({ type: 'spki', format: 'pem' }) as string
  return importSPKI(spki, 'RS256')
}

export async function getPublicJwk() {
  const publicKey = await getPublicKey()
  const jwk = await exportJWK(publicKey)
  return { ...jwk, kid: env.jwt.keyId, use: 'sig', alg: 'RS256' }
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const privateKey = await getPrivateKey()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256', kid: env.jwt.keyId })
    .setIssuedAt()
    .setExpirationTime(`${env.jwt.ttlSeconds}s`)
    .sign(privateKey)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const publicKey = await getPublicKey()
    const { payload } = await jwtVerify(token, publicKey)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
