/**
 * Payment provider layer. App code only talks to these terms;
 * Stripe Managed Payments lives in an adapter behind this interface.
 */
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
}

export function priceFor(currency: HomeCurrency, earlyBird: boolean) {
  return earlyBird ? FIXED_PRICES.earlyBird[currency] : FIXED_PRICES.full[currency]
}

/** Demo checkout — grants Pro immediately (Stripe adapter replaces this at launch). */
export function mockStartCheckout(args: {
  accountId: string
  emailVerified: boolean
  billingCountry: string
  currency: HomeCurrency
  alreadyPro: boolean
  paymentPending: boolean
  earlyBirdSold: number
}): CheckoutResult {
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

export function earlyBirdPlacesLeft(sold: number) {
  return Math.max(0, EARLY_BIRD_CAP - sold)
}
