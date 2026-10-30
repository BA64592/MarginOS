/**
 * Payment provider layer. App code only talks to these terms;
 * Stripe Managed Payments lives behind startCheckout / mockStartCheckout.
 */
import { isLiveStripeEnabled } from '../demoFlags'
import { formatMoney } from '../format'
import type { HomeCurrency } from '../types'

export const EARLY_BIRD_CAP = 200
export const PRO_PRICE_GBP = 59
export const EARLY_BIRD_PRICE_GBP = 39

/** Fixed local tax-inclusive prices — single source for Pro amounts. */
export const FIXED_PRICES = {
  full: { GBP: 59, USD: 79, EUR: 69, CAD: 109, AUD: 109 },
  earlyBird: { GBP: 39, USD: 52, EUR: 47, CAD: 73, AUD: 74 },
} as const

/** SMP tax-covered countries (abbreviated launch list — full 81 from Stripe at setup). */
export const ALLOWED_BUYER_COUNTRIES = new Set([
  'GB', 'US', 'CA', 'AU', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL', 'NZ', 'CH', 'NO',
])

export type LicenceState =
  | 'active'
  | 'removed_full_refund'
  | 'removed_lost_dispute'
  | 'refunded_duplicate'
  | 'none'

export interface LicenceRecord {
  id: string
  accountId: string
  provider: 'mock' | 'stripe_smp'
  pricePaid: number
  currency: HomeCurrency
  earlyBird: boolean
  amountRefunded: number
  disputeState: 'none' | 'open' | 'lost' | 'won' | 'prevented' | 'warning_closed'
  state: LicenceState
  createdAt: string
}

export interface CheckoutResult {
  ok: boolean
  message: string
  licence?: LicenceRecord
  earlyBirdSold?: number
  /** When set, browser should redirect to Stripe Checkout (Sold through Link). */
  checkoutUrl?: string
}

export function priceFor(currency: HomeCurrency, earlyBird: boolean) {
  return earlyBird ? FIXED_PRICES.earlyBird[currency] : FIXED_PRICES.full[currency]
}

export type CheckoutArgs = {
  accountId: string
  email: string
  emailVerified: boolean
  billingCountry: string
  currency: HomeCurrency
  alreadyPro: boolean
  paymentPending: boolean
  earlyBirdSold: number
}

function validateCheckoutGates(args: CheckoutArgs): CheckoutResult | null {
  if (!args.emailVerified) {
    return { ok: false, message: 'Verify your email before checkout.' }
  }
  if (!ALLOWED_BUYER_COUNTRIES.has(args.billingCountry.toUpperCase())) {
    return { ok: false, message: "MarginOS isn't available in your country yet." }
  }
  if (args.alreadyPro) {
    return { ok: false, message: 'You already have Pro' }
  }
  if (args.paymentPending) {
    return { ok: false, message: 'Your payment is processing' }
  }
  return null
}

/** Demo checkout — grants Pro immediately when Stripe is not configured. */
export function mockStartCheckout(args: CheckoutArgs): CheckoutResult {
  const gate = validateCheckoutGates(args)
  if (gate) return gate
  const earlyBird = args.earlyBirdSold < EARLY_BIRD_CAP
  const amount = priceFor(args.currency, earlyBird)
  const licence: LicenceRecord = {
    id: `lic_${Date.now()}`,
    accountId: args.accountId,
    provider: 'mock',
    pricePaid: amount,
    currency: args.currency,
    earlyBird,
    amountRefunded: 0,
    disputeState: 'none',
    state: 'active',
    createdAt: new Date().toISOString(),
  }
  return {
    ok: true,
    message: earlyBird
      ? `Pro unlocked at early-bird ${formatMoney(amount, args.currency, true)}.`
      : `Pro unlocked at ${formatMoney(amount, args.currency, true)}.`,
    licence,
    earlyBirdSold: args.earlyBirdSold + (earlyBird ? 1 : 0),
  }
}

/** Live Stripe SMP path — calls /api/checkout (Vercel). Falls back to clear error if API missing. */
export async function stripeStartCheckout(args: CheckoutArgs): Promise<CheckoutResult> {
  const gate = validateCheckoutGates(args)
  if (gate) return gate
  const earlyBird = args.earlyBirdSold < EARLY_BIRD_CAP
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: args.accountId,
        email: args.email,
        currency: args.currency,
        billingCountry: args.billingCountry,
        earlyBird,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/?checkout=cancel`,
      }),
    })
    const data = (await res.json()) as { ok?: boolean; message?: string; url?: string }
    if (!res.ok || !data.ok || !data.url) {
      return {
        ok: false,
        message: data.message || 'Stripe Checkout is not available. Complete K4 and set secrets.',
      }
    }
    return {
      ok: true,
      message: 'Redirecting to Stripe Checkout (Sold through Link)…',
      checkoutUrl: data.url,
    }
  } catch {
    return {
      ok: false,
      message: 'Could not reach Stripe checkout API. Deploy api/checkout and set STRIPE_SECRET_KEY.',
    }
  }
}

/** Unified entry — live Stripe when configured, otherwise mock (dev/demo). */
export async function startCheckout(args: CheckoutArgs): Promise<CheckoutResult> {
  if (isLiveStripeEnabled()) return stripeStartCheckout(args)
  return mockStartCheckout(args)
}

export function earlyBirdPlacesLeft(sold: number) {
  return Math.max(0, EARLY_BIRD_CAP - sold)
}
