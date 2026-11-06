/**
 * Stripe Checkout + webhook helpers for DigitalOcean runtime (and local smoke).
 * Spec: v16 §12.10 / docs/checklists/stripe-smp.md
 */
import Stripe from 'stripe'
import { setUserPlan, setUserPlanByEmail, userFromRequest } from './auth-handlers.mjs'
import { dbConfigured, query } from './db.mjs'

const ALLOWED = new Set([
  'GB',
  'US',
  'CA',
  'AU',
  'IE',
  'FR',
  'DE',
  'ES',
  'IT',
  'NL',
  'BE',
  'AT',
  'PT',
  'SE',
  'DK',
  'FI',
  'PL',
  'NZ',
  'CH',
  'NO',
])

export function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  return new Stripe(secret, {
    apiVersion: process.env.STRIPE_API_VERSION || '2025-03-31.basil',
  })
}

export function stripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_FULL &&
      process.env.STRIPE_PRICE_EARLY_BIRD,
  )
}

/**
 * Create Checkout. Identity MUST come from the authenticated session (BUG-023).
 * Call as createCheckoutSession(body, req) — body.accountId/email are ignored when a session exists.
 */
export async function createCheckoutSession(body, req) {
  const stripe = stripeClient()
  if (!stripe) {
    return {
      status: 503,
      body: {
        ok: false,
        message: 'Stripe is not configured (STRIPE_SECRET_KEY). Complete K4 then set secrets.',
      },
    }
  }

  let accountId = ''
  let email = ''
  if (req && dbConfigured()) {
    const user = await userFromRequest(req)
    if (!user) {
      return { status: 401, body: { ok: false, message: 'Sign in to start checkout.' } }
    }
    accountId = String(user.id)
    email = String(user.email || '')
  } else if (process.env.NODE_ENV === 'production' || dbConfigured()) {
    // Fail closed in hosted envs when we cannot bind a session.
    return {
      status: 401,
      body: { ok: false, message: 'Sign in to start checkout.' },
    }
  } else {
    // Local/dev without DB: allow body identity for smoke tests only.
    accountId = String(body.accountId || '')
    email = String(body.email || '')
  }

  const country = String(body.billingCountry || '').toUpperCase()
  if (!ALLOWED.has(country)) {
    return {
      status: 400,
      body: { ok: false, message: "Margins 365 isn't available in your country yet." },
    }
  }

  const priceId = body.earlyBird
    ? process.env.STRIPE_PRICE_EARLY_BIRD
    : process.env.STRIPE_PRICE_FULL
  if (!priceId) {
    return { status: 503, body: { ok: false, message: 'Stripe price IDs not configured.' } }
  }

  const base = {
    mode: 'payment',
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
    },
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ...base,
      // Managed Payments / Link — ignore if account not yet eligible
      managed_payments: { enabled: true },
    })
    if (!session.url) {
      return { status: 502, body: { ok: false, message: 'Stripe Checkout Session failed.' } }
    }
    return {
      status: 200,
      body: { ok: true, url: session.url, sessionId: session.id },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    // Retry without managed_payments if the account isn't SMP-enabled yet
    if (String(message).toLowerCase().includes('managed_payments')) {
      try {
        const stripe2 = stripeClient()
        const session = await stripe2.checkout.sessions.create(base)
        return {
          status: 200,
          body: {
            ok: true,
            url: session.url,
            sessionId: session.id,
            managedPayments: false,
            message: 'Checkout created without managed_payments (enable SMP in Stripe Dashboard when eligible).',
          },
        }
      } catch (err2) {
        return {
          status: 502,
          body: { ok: false, message: err2 instanceof Error ? err2.message : message },
        }
      }
    }
    return { status: 502, body: { ok: false, message } }
  }
}

/** Fallback in-memory de-dupe when DB is unavailable. */
const seenEvents = new Set()

async function alreadyProcessed(eventId) {
  if (dbConfigured()) {
    const { rows } = await query(`SELECT 1 FROM stripe_events WHERE id = $1`, [eventId])
    return rows.length > 0
  }
  return seenEvents.has(eventId)
}

async function markProcessed(eventId, type) {
  if (dbConfigured()) {
    await query(
      `INSERT INTO stripe_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [eventId, type],
    )
    return
  }
  seenEvents.add(eventId)
}

async function applyCheckoutCompleted(session) {
  const accountId =
    session.client_reference_id ||
    session.metadata?.marginos_account_id ||
    ''
  const email = session.customer_details?.email || session.customer_email || ''
  if (accountId) await setUserPlan(accountId, 'pro', 'active')
  else if (email) await setUserPlanByEmail(email, 'pro', 'active')
}

async function applyRefundOrDispute(object) {
  // K8: keep data export-only — mark licence removed but do not delete shop rows (client-held).
  const email = object.billing_details?.email || object.receipt_email || ''
  const metaAccount = object.metadata?.marginos_account_id
  if (metaAccount) await setUserPlan(metaAccount, 'free', 'removed_full_refund')
  else if (email) await setUserPlanByEmail(email, 'free', 'removed_full_refund')
}

export async function handleStripeWebhook(rawBody, signature) {
  const stripe = stripeClient()
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !whSecret) {
    return {
      status: 503,
      body: { ok: false, message: 'Webhook secrets not configured (K4).' },
    }
  }
  if (!signature) {
    return { status: 400, body: { ok: false, message: 'Missing stripe-signature' } }
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, whSecret)
  } catch (err) {
    return {
      status: 400,
      body: { ok: false, message: err instanceof Error ? err.message : 'Invalid signature' },
    }
  }

  if (await alreadyProcessed(event.id)) {
    return { status: 200, body: { received: true, id: event.id, duplicate: true } }
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await applyCheckoutCompleted(event.data.object)
    } else if (event.type === 'charge.refunded') {
      await applyRefundOrDispute(event.data.object)
    } else if (event.type === 'charge.dispute.closed') {
      const d = event.data.object
      if (d.status === 'lost') await applyRefundOrDispute(d)
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err)
    return {
      status: 500,
      body: { ok: false, message: err instanceof Error ? err.message : 'Webhook handler failed' },
    }
  }

  await markProcessed(event.id, event.type)
  console.info('[stripe-webhook]', event.type, event.id)
  return { status: 200, body: { received: true, id: event.id, type: event.type } }
}
