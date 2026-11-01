/**
 * Stripe Checkout + webhook helpers for DigitalOcean runtime (and local smoke).
 * Spec: v16 §12.10 / docs/checklists/stripe-smp.md
 */
import Stripe from 'stripe'

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

export async function createCheckoutSession(body) {
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

  const country = String(body.billingCountry || '').toUpperCase()
  if (!ALLOWED.has(country)) {
    return {
      status: 400,
      body: { ok: false, message: "MarginOS isn't available in your country yet." },
    }
  }

  const priceId = body.earlyBird
    ? process.env.STRIPE_PRICE_EARLY_BIRD
    : process.env.STRIPE_PRICE_FULL
  if (!priceId) {
    return { status: 503, body: { ok: false, message: 'Stripe price IDs not configured.' } }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: String(body.accountId || ''),
      customer_email: String(body.email || '') || undefined,
      success_url: String(body.successUrl || 'https://marginos.online/?checkout=success'),
      cancel_url: String(body.cancelUrl || 'https://marginos.online/?checkout=cancel'),
      line_items: [{ price: priceId, quantity: 1 }],
      // Managed Payments / Link — ignore if account not yet eligible
      managed_payments: { enabled: true },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: {
        marginos_account_id: String(body.accountId || ''),
        early_bird: body.earlyBird ? '1' : '0',
        billing_country: country,
      },
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
        const session = await stripe2.checkout.sessions.create({
          mode: 'payment',
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
        })
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

/** In-memory event de-dupe for single instance (replace with DB for multi-instance). */
const seenEvents = new Set()

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

  if (seenEvents.has(event.id)) {
    return { status: 200, body: { received: true, id: event.id, duplicate: true } }
  }
  seenEvents.add(event.id)
  if (seenEvents.size > 5000) {
    const first = seenEvents.values().next().value
    seenEvents.delete(first)
  }

  // Licence persistence needs a durable store (B3). Log for operators until then.
  console.info('[stripe-webhook]', event.type, event.id)
  return { status: 200, body: { received: true, id: event.id, type: event.type } }
}
