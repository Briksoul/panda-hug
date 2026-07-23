import { createHmac, timingSafeEqual } from 'node:crypto'

function isAuthorized(authorization, secret) {
  if (!authorization?.startsWith('Bearer ')) return false
  const token = authorization.slice(7)
  if (token === secret) return true
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (signature.length !== expected.length) return false
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false
  try {
    const decoded = Buffer.from(payload, 'base64url').toString()
    const expiresAt = Number(decoded.slice(decoded.lastIndexOf(':') + 1))
    return Number.isFinite(expiresAt) && expiresAt >= Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (request.method === 'OPTIONS') {
    return response.status(204).end()
  }
  if (request.method !== 'POST') {
    return response.status(405).json({ detail: 'Method not allowed' })
  }
  if (!isAuthorized(request.headers.authorization, process.env.PROXY_SECRET)) {
    return response.status(401).json({ detail: 'Unauthorized' })
  }

  const credentials = Buffer.from(
    `${process.env.HUME_API_KEY}:${process.env.HUME_SECRET_KEY}`,
  ).toString('base64')
  const humeResponse = await fetch('https://api.hume.ai/oauth2-cc/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
        + 'AppleWebKit/537.36 (KHTML, like Gecko) '
        + 'Chrome/124.0.0.0 Safari/537.36'
      ),
    },
    body: 'grant_type=client_credentials',
  })
  const body = await humeResponse.text()
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader(
    'Content-Type',
    humeResponse.headers.get('Content-Type') || 'application/json',
  )
  return response.status(humeResponse.status).send(body)
}
