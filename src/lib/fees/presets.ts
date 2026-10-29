/**
 * Temporary fee presets (spec §12.3). Source links + Business & Product sign-off pending — see docs/OPEN-QUESTIONS.md Q3.
 * Rates are typical public figures as of build and must be rechecked before launch.
 */
import type { HomeCurrency, Platform } from '../types'

export type ComparedFeeType = 'referral' | 'payment' | 'listing'

export interface FeePreset {
  platform: Platform
  region: 'UK' | 'EU' | 'US' | 'CA' | 'AU'
  feeType: ComparedFeeType
  percent: number
  fixedPerOrder: number
  source: string
  asOf: string
}

export const FEE_PRESETS: FeePreset[] = [
  { platform: 'shopify', region: 'UK', feeType: 'payment', percent: 1.5, fixedPerOrder: 0.2, source: 'Shopify Payments UK (placeholder)', asOf: '2026-10-29' },
  { platform: 'shopify', region: 'US', feeType: 'payment', percent: 2.9, fixedPerOrder: 0.3, source: 'Shopify Payments US (placeholder)', asOf: '2026-10-29' },
  { platform: 'shopify', region: 'EU', feeType: 'payment', percent: 1.5, fixedPerOrder: 0.25, source: 'Shopify Payments EU (placeholder)', asOf: '2026-10-29' },
  { platform: 'shopify', region: 'CA', feeType: 'payment', percent: 2.9, fixedPerOrder: 0.3, source: 'Shopify Payments CA (placeholder)', asOf: '2026-10-29' },
  { platform: 'shopify', region: 'AU', feeType: 'payment', percent: 1.7, fixedPerOrder: 0.3, source: 'Shopify Payments AU (placeholder)', asOf: '2026-10-29' },
  { platform: 'amazon', region: 'UK', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon UK referral (placeholder)', asOf: '2026-10-29' },
  { platform: 'amazon', region: 'US', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon US referral (placeholder)', asOf: '2026-10-29' },
  { platform: 'amazon', region: 'EU', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon EU referral (placeholder)', asOf: '2026-10-29' },
  { platform: 'amazon', region: 'CA', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon CA referral (placeholder)', asOf: '2026-10-29' },
  { platform: 'amazon', region: 'AU', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon AU referral (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'UK', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, source: 'Etsy transaction fee (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'UK', feeType: 'payment', percent: 4, fixedPerOrder: 0.25, source: 'Etsy payment processing UK (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'UK', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'US', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, source: 'Etsy transaction fee (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'US', feeType: 'payment', percent: 3, fixedPerOrder: 0.25, source: 'Etsy payment processing US (placeholder)', asOf: '2026-10-29' },
  { platform: 'etsy', region: 'US', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee (placeholder)', asOf: '2026-10-29' },
]

export function regionForCountry(country: string): FeePreset['region'] {
  const c = country.toUpperCase()
  if (c === 'GB' || c === 'UK') return 'UK'
  if (c === 'US') return 'US'
  if (c === 'CA') return 'CA'
  if (c === 'AU') return 'AU'
  return 'EU'
}

/** Returns excess percentage points above preset when every compared fee type is actual; otherwise null. */
export function compareFees(
  lines: {
    platform: Platform
    country: string
    lineValue: number
    referralFee: number
    paymentFee: number
    listingFee: number
    feesActual: { referral: boolean; payment: boolean; listing: boolean }
  }[],
  _currency: HomeCurrency,
): { comparable: boolean; excessPp: number | null } {
  const compared = lines.filter(
    (l) => l.feesActual.referral && l.feesActual.payment && l.feesActual.listing,
  )
  // Sample data often has partial actuals — require all three actual on lines to compare.
  // Spec: platform/fee type only compared when actual uploaded; Fees part off unless EVERY compared type is actual.
  const anyEstimated = lines.some(
    (l) => !l.feesActual.referral || !l.feesActual.payment || !l.feesActual.listing,
  )
  if (anyEstimated || compared.length === 0) {
    return { comparable: false, excessPp: null }
  }

  let actualFees = 0
  let presetFees = 0
  let revenue = 0
  for (const l of compared) {
    revenue += l.lineValue
    actualFees += l.referralFee + l.paymentFee + l.listingFee
    const region = regionForCountry(l.country)
    for (const feeType of ['referral', 'payment', 'listing'] as ComparedFeeType[]) {
      const preset = FEE_PRESETS.find(
        (p) => p.platform === l.platform && p.region === region && p.feeType === feeType,
      )
      if (preset) {
        presetFees += (preset.percent / 100) * l.lineValue + preset.fixedPerOrder
      }
    }
  }
  if (revenue <= 0) return { comparable: false, excessPp: null }
  const actualPct = (actualFees / revenue) * 100
  const presetPct = (presetFees / revenue) * 100
  return { comparable: true, excessPp: actualPct - presetPct }
}
