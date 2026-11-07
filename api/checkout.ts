/**
 * Stripe Checkout Session — subscription tiers (v19).
 * Vercel serverless entry — same behaviour as DigitalOcean `scripts/stripe-handlers.mjs`.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const ALLOWED = new Set([
  'GB', 'US', 'CA', 'AU', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL', 'NZ', 'CH', 'NO',
])

const COOKIE = 'marginos_session'
const PLAN_IDS = new Set(['starter', 'growth', 'pro', 'scale'])
const TRIAL_DAYS = Number(process.env.STRIPE_TRIAL_DAYS || 14)

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

function priceIdForPlan(planId: string, interval: string): string | null {
  const plan = planId.toLowerCase()
  const iv = interval.toLowerCase() === 'year' ? 'YEAR' : 'MONTH'
  if (!PLAN_IDS.has(plan)) return null
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${iv}`
  return process.env[key] || null
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
  if (!sid) {
    res.status(401).json({ ok: false, message: 'Sign in to start checkout.' })
    return
  }

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
    res.status(400).json({ ok: false, message: "Margins 365 isn't available in your country yet." })
    return
  }

  const planId = PLAN_IDS.has(String(body.planId || '').toLowerCase())
    ? String(body.planId).toLowerCase()
    : 'pro'
  const interval = String(body.interval || 'month').toLowerCase() === 'year' ? 'year' : 'month'
  const priceId = priceIdForPlan(planId, interval)
  if (!priceId) {
    res.status(503).json({
      ok: false,
      message: `Stripe price not configured for ${planId}/${interval}.`,
    })
    return
  }

  const stripe = new Stripe(secret, {
    apiVersion: (process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion) || '2025-03-31.basil',
  })

  const origin =
    process.env.APP_ORIGIN ||
    (process.env.VITE_PRODUCT_DOMAIN
      ? `https://${process.env.VITE_PRODUCT_DOMAIN}`
      : 'https://margins365.com')

  const meta = {
    margins365_account_id: accountId,
    marginos_account_id: accountId,
    margins365_plan: planId,
    marginos_plan: planId,
    margins365_interval: interval,
    billing_country: country,
    marginos_session_present: '1',
  }

  const trialDays = Number(body.trialDays || TRIAL_DAYS)
  const base: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    client_reference_id: accountId,
    customer_email: email || undefined,
    success_url: String(body.successUrl || `${origin.replace(/\/$/, '')}/?checkout=success`),
    cancel_url: String(body.cancelUrl || `${origin.replace(/\/$/, '')}/?checkout=cancel`),
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      metadata: meta,
    },
    metadata: meta,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  }

  try {
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        ...base,
        // @ts-expect-error managed_payments may be unavailable on some accounts
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
    res.status(200).json({ ok: true, url: session.url, sessionId: session.id, planId, interval })
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err instanceof Error ? err.message : 'Checkout failed',
    })
  }
}
