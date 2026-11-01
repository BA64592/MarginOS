/**
 * Stripe Managed Payments Checkout Session (v16 §12.10).
 * Vercel serverless entry — same behaviour as DigitalOcean `scripts/stripe-handlers.mjs`.
 *
 * POST body: { accountId, email, currency, billingCountry, earlyBird, successUrl, cancelUrl }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const ALLOWED = new Set([
  'GB', 'US', 'CA', 'AU', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL', 'NZ', 'CH', 'NO',
])

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
    client_reference_id: String(body.accountId || ''),
    customer_email: String(body.email || '') || undefined,
    success_url: String(body.successUrl || 'https://marginos.online/?checkout=success'),
    cancel_url: String(body.cancelUrl || 'https://marginos.online/?checkout=cancel'),
    line_items: [{ price: priceId, quantity: 1 }],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    metadata: {
      marginos_account_id: String(body.accountId || ''),
      early_bird: body.earlyBird ? '1' : '0',
      billing_country: country,
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
