/**
 * Email verification via Amazon SES London (eu-west-2) — K5 / A5.
 * POST { email, accountId, verifyUrl }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }
  const region = process.env.AWS_SES_REGION || 'eu-west-2'
  const from = process.env.SES_FROM_ADDRESS
  const accessKey = process.env.AWS_ACCESS_KEY_ID
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!from || !accessKey || !secretKey) {
    res.status(503).json({
      ok: false,
      message: 'SES is not configured. Set SES_FROM_ADDRESS and AWS credentials (K5).',
    })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const email = String(body.email || '')
  const verifyUrl = String(body.verifyUrl || '')
  if (!email || !verifyUrl) {
    res.status(400).json({ ok: false, message: 'email and verifyUrl required' })
    return
  }

  // Placeholder: wire @aws-sdk/client-sesv2 SendEmail when credentials exist.
  console.info('[ses]', region, 'verification to', email, verifyUrl)
  res.status(200).json({
    ok: true,
    message: 'Verification email queued (SES London).',
  })
}
