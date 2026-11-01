/**
 * Create MarginOS Pro product + tax-inclusive prices in Stripe (test or live).
 * Usage: STRIPE_SECRET_KEY=sk_... node scripts/stripe-bootstrap-products.mjs
 *
 * Prints price IDs to set as STRIPE_PRICE_FULL / STRIPE_PRICE_EARLY_BIRD.
 */
import Stripe from 'stripe'

const secret = process.env.STRIPE_SECRET_KEY
if (!secret) {
  console.error('Set STRIPE_SECRET_KEY')
  process.exit(1)
}

const stripe = new Stripe(secret, {
  apiVersion: process.env.STRIPE_API_VERSION || '2025-03-31.basil',
})

const FULL = {
  GBP: 5900,
  USD: 7900,
  EUR: 6900,
  CAD: 10900,
  AUD: 10900,
}
const EARLY = {
  GBP: 3900,
  USD: 5200,
  EUR: 4700,
  CAD: 7300,
  AUD: 7400,
}

function currencyOptions(map, primary) {
  const opts = {}
  for (const [cur, unit] of Object.entries(map)) {
    if (cur === primary) continue
    opts[cur.toLowerCase()] = {
      unit_amount: unit,
      tax_behavior: 'inclusive',
    }
  }
  return opts
}

const product = await stripe.products.create({
  name: 'MarginOS Pro',
  description: 'Lifetime MarginOS Pro licence — keep your data, saved datasets and history.',
  tax_code: 'txcd_10103001',
  metadata: { marginos: 'pro_lifetime' },
})

const full = await stripe.prices.create({
  product: product.id,
  currency: 'gbp',
  unit_amount: FULL.GBP,
  tax_behavior: 'inclusive',
  currency_options: currencyOptions(FULL, 'GBP'),
  nickname: 'MarginOS Pro — full',
  metadata: { marginos_tier: 'full' },
})

const early = await stripe.prices.create({
  product: product.id,
  currency: 'gbp',
  unit_amount: EARLY.GBP,
  tax_behavior: 'inclusive',
  currency_options: currencyOptions(EARLY, 'GBP'),
  nickname: 'MarginOS Pro — early bird',
  metadata: { marginos_tier: 'early_bird' },
})

console.log(
  JSON.stringify(
    {
      productId: product.id,
      STRIPE_PRICE_FULL: full.id,
      STRIPE_PRICE_EARLY_BIRD: early.id,
    },
    null,
    2,
  ),
)
