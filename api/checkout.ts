/**
 * Stripe Managed Payments Checkout Session (v16 §12.10).
 * Deploy on Vercel. Requires STRIPE_SECRET_KEY + price price IDs from K4 setup.
 *
 * POST body: { accountId, email, currency, billingCountry, earlyBird, successUrl, cancelUrl }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

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

  try {
    const params = new URLSearchParams()
    params.set('mode', 'payment')
    params.set('client_reference_id', String(body.accountId || ''))
    params.set('customer_email', String(body.email || ''))
    params.set('success_url', String(body.successUrl || 'https://example.com/?checkout=success'))
    params.set('cancel_url', String(body.cancelUrl || 'https://example.com/?checkout=cancel'))
    params.set('line_items[0][price]', priceId)
    params.set('line_items[0][quantity]', '1')
    params.set('managed_payments[enabled]', 'true')
    params.set('expires_at', String(Math.floor(Date.now() / 1000) + 30 * 60))

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': process.env.STRIPE_API_VERSION || '2025-03-31.basil',
      },
      body: params,
    })
    const session = (await stripeRes.json()) as { id?: string; url?: string; error?: { message?: string } }
    if (!stripeRes.ok || !session.url) {
      res.status(502).json({
        ok: false,
        message: session.error?.message || 'Stripe Checkout Session failed.',
      })
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
