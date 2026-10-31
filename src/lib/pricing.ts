/**
 * Single source for Pro prices and paywall copy.
 * Amounts come from FIXED_PRICES (tax-inclusive local prices).
 */
import { formatMoney } from './format'
import {
  EARLY_BIRD_CAP,
  FIXED_PRICES,
  earlyBirdPlacesLeft,
} from './payments/provider'
import type { HomeCurrency } from './types'

export { EARLY_BIRD_CAP, FIXED_PRICES, earlyBirdPlacesLeft }

export function earlyBirdPrice(currency: HomeCurrency) {
  return FIXED_PRICES.earlyBird[currency]
}

export function fullProPrice(currency: HomeCurrency) {
  return FIXED_PRICES.full[currency]
}

export function formatEarlyBirdPrice(currency: HomeCurrency) {
  return formatMoney(earlyBirdPrice(currency), currency, true)
}

export function formatFullProPrice(currency: HomeCurrency) {
  return formatMoney(fullProPrice(currency), currency, true)
}

/** Canonical Pro unlock line for every paywall (brand K19). */
export function proUnlockPaywallCopy(currency: HomeCurrency, earlyBirdLeft = EARLY_BIRD_CAP) {
  if (earlyBirdLeft > 0) {
    return `Unlock with Pro for ${formatEarlyBirdPrice(currency)} early-bird (then ${formatFullProPrice(currency)}). No subscription.`
  }
  return `Unlock with Pro for ${formatFullProPrice(currency)}. No subscription.`
}

export function proShortCta(currency: HomeCurrency, earlyBirdLeft: number) {
  if (earlyBirdLeft > 0) {
    return `Pro · ${formatEarlyBirdPrice(currency)} early-bird`
  }
  return `Pro · ${formatFullProPrice(currency)}`
}

export function proHeroCta(currency: HomeCurrency, earlyBirdLeft: number) {
  if (earlyBirdLeft > 0) {
    return `Get Pro · ${formatEarlyBirdPrice(currency)} early-bird`
  }
  return `Get Pro · ${formatFullProPrice(currency)}`
}

export function proModalHeadline(currency: HomeCurrency, earlyBirdLeft: number) {
  // Brand K19 — avoid "lifetime" in-app until legal clears it (K17).
  if (earlyBirdLeft > 0) {
    return `Pro · ${formatEarlyBirdPrice(currency)} early-bird (then ${formatFullProPrice(currency)}). Tax-inclusive. No subscription.`
  }
  return `Pro · ${formatFullProPrice(currency)}. Tax-inclusive. No subscription.`
}

export function proCheckoutButtonLabel(currency: HomeCurrency, earlyBirdLeft: number) {
  const amount = earlyBirdLeft > 0 ? earlyBirdPrice(currency) : fullProPrice(currency)
  return `Unlock Pro · ${formatMoney(amount, currency, true)}`
}
