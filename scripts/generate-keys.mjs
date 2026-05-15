import { generateKeyPairSync } from 'crypto'

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const b64 = Buffer.from(privateKey).toString('base64')
console.log('\nAdd this to your .env.local:\n')
console.log(`JWT_PRIVATE_KEY=${b64}`)
console.log()
