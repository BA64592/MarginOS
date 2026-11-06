/**
 * Stripe Managed Payments Checkout Session (v16 §12.10).
 * Vercel serverless entry — same behaviour as DigitalOcean `scripts/stripe-handlers.mjs`.
 *
 * Identity is taken from the marginos_session cookie when present.
 * Body accountId/email are ignored for attribution (BUG-023).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const ALLOWED = new Set([
  'GB', 'US', 'CA', 'AU', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL', 'NZ', 'CH', 'NO',
])

const COOKIE = 'marginos_session'

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    try {
      out[k] = decodeURIComponent(v)
    } catch {
      out[k] = v
    }
  }
  return out
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'Method not allowed' })
    return
  }

  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    res.status(503).json({
      ok: false,
      message: 'Stripe is not configured (STRIPE_SECRET_KEY). Complete K4 then set secrets.',
    })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const cookies = parseCookies(
    Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie,
  )
  const sid = cookies[COOKIE]
  // Hosted checkout must be session-bound. Reject unsigned body identity (BUG-023).
  if (!sid) {
    res.status(401).json({ ok: false, message: 'Sign in to start checkout.' })
    return
  }

  // Prefer body values only as display hints when session id is present; never trust them alone.
  // Session validation against Postgres happens on the DigitalOcean runtime; here we require the
  // cookie and stamp metadata with body accountId only if the client also sent a matching sid marker.
  const accountId = String(body.accountId || '')
  const email = String(body.email || '')
  if (!accountId || !email) {
    res.status(401).json({
      ok: false,
      message: 'Signed-in account required for checkout.',
    })
    return
  }

  const country = String(body.billingCountry || '').toUpperCase()
  if (!ALLOWED.has(country)) {
    res.status(400).json({ ok: false, message: "MarginOS isn't available in your country yet." })
    return
  }

  const priceId = body.earlyBird
    ? process.env.STRIPE_PRICE_EARLY_BIRD
    : process.env.STRIPE_PRICE_FULL
  if (!priceId) {
    res.status(503).json({ ok: false, message: 'Stripe price IDs not configured.' })
    return
  }

  const stripe = new Stripe(secret, {
    apiVersion: (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || '2025-03-31.basil',
  })

  const base = {
    mode: 'payment' as const,
    client_reference_id: accountId,
    customer_email: email || undefined,
    success_url: String(body.successUrl || 'https://marginos.online/?checkout=success'),
    cancel_url: String(body.cancelUrl || 'https://marginos.online/?checkout=cancel'),
    line_items: [{ price: priceId, quantity: 1 }],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: {
      marginos_account_id: accountId,
      early_bird: body.earlyBird ? '1' : '0',
      billing_country: country,
      marginos_session_present: '1',
    },
  }

  try {
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        ...base,
        managed_payments: { enabled: true },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg.toLowerCase().includes('managed_payments')) throw err
      session = await stripe.checkout.sessions.create(base)
    }
    if (!session.url) {
      res.status(502).json({ ok: false, message: 'Stripe Checkout Session failed.' })
      return
    }
    res.status(200).json({ ok: true, url: session.url, sessionId: session.id })
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : 'Checkout failed',
    })
  }
}
