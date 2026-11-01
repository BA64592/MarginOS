/**
 * Email verification via Amazon SES (K5 / A5).
 * POST { email, accountId, verifyUrl }
 *
 * Region defaults to eu-north-1; override with AWS_SES_REGION or AWS_REGION.
 * From-address: SES_FROM_ADDRESS or SES_FROM_EMAIL.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSesConfig, sendVerificationEmail } from '../lib/sesMail'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }

  const config = readSesConfig()
  if ('error' in config) {
    res.status(503).json({ ok: false, message: config.error })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const email = String(body?.email || '')
  const verifyUrl = String(body?.verifyUrl || '')
  if (!email || !verifyUrl) {
    res.status(400).json({ ok: false, message: 'email and verifyUrl required' })
    return
  }

  const result = await sendVerificationEmail({ to: email, verifyUrl, config })
  if (!result.ok) {
    res.status(502).json({ ok: false, message: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    message: 'Verification email sent.',
    messageId: result.messageId,
  })
}
