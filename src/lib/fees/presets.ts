/**
 * DRAFT fee presets from amendment v16.1 A2.
 * Status: pending Akthar sign-off (K3). Coded for development; labelled draft in UI/maths.
 * Sources checked by Business & Product 29 October 2026.
 */
import type { HomeCurrency, Platform } from '../types'

export type ComparedFeeType = 'referral' | 'payment' | 'listing'

export type FeeRegion = 'UK' | 'EU' | 'US' | 'CA' | 'AU'

export interface FeePreset {
  platform: Platform
  region: FeeRegion
  feeType: ComparedFeeType
  /** Shopify plan used for payment preset — Basic recommended (K3b, pending). */
  shopifyPlan?: 'Basic'
  percent: number
  fixedPerOrder: number
  /** Extra % on item+shipping for Etsy regulatory operating fee (folded into referral). */
  regulatoryPercent?: number
  notes?: string
  source: string
  asOf: string
  status: 'draft'
}

/** Shopify Payments Basic plan — domestic online card (K3b recommendation). */
export const FEE_PRESETS: FeePreset[] = [
  // Shopify payment (Basic)
  { platform: 'shopify', region: 'UK', feeType: 'payment', shopifyPlan: 'Basic', percent: 2.0, fixedPerOrder: 0.25, source: 'shopify.com/uk/pricing', asOf: '2026-10-29', status: 'draft' },
  { platform: 'shopify', region: 'EU', feeType: 'payment', shopifyPlan: 'Basic', percent: 2.0, fixedPerOrder: 0.25, notes: 'Ireland checked; other EU countries confirm per country page', source: 'shopify.com/ie/pricing', asOf: '2026-10-29', status: 'draft' },
  { platform: 'shopify', region: 'US', feeType: 'payment', shopifyPlan: 'Basic', percent: 2.9, fixedPerOrder: 0.3, source: 'shopify.com/pricing', asOf: '2026-10-29', status: 'draft' },
  { platform: 'shopify', region: 'CA', feeType: 'payment', shopifyPlan: 'Basic', percent: 2.8, fixedPerOrder: 0.3, source: 'shopify.com/ca/pricing', asOf: '2026-10-29', status: 'draft' },
  { platform: 'shopify', region: 'AU', feeType: 'payment', shopifyPlan: 'Basic', percent: 1.7, fixedPerOrder: 0.3, source: 'shopify.com/au/pricing', asOf: '2026-10-29', status: 'draft' },

  // Amazon referral — Everything else 15% (K3c recommended default)
  { platform: 'amazon', region: 'UK', feeType: 'referral', percent: 15, fixedPerOrder: 0.25, notes: 'Everything else + £0.25 min; category note in Show the maths', source: 'Amazon UK referral fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'amazon', region: 'US', feeType: 'referral', percent: 15, fixedPerOrder: 0.3, notes: 'Everything else + $0.30 min', source: 'Amazon US referral fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'amazon', region: 'EU', feeType: 'referral', percent: 15, fixedPerOrder: 0.3, notes: 'Everything else + €0.30 min (DE schedule)', source: 'Amazon.de referral fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'amazon', region: 'CA', feeType: 'referral', percent: 15, fixedPerOrder: 0.4, source: 'Amazon CA referral fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'amazon', region: 'AU', feeType: 'referral', percent: 15, fixedPerOrder: 0, source: 'Amazon AU referral fees', asOf: '2026-10-29', status: 'draft' },

  // Etsy
  { platform: 'etsy', region: 'UK', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, regulatoryPercent: 0.48, source: 'Etsy Fees and taxes / Regulatory operating fee', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'UK', feeType: 'payment', percent: 4, fixedPerOrder: 0.2, source: 'Etsy Payment processing fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'UK', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, notes: '$0.20 per unit sold converted at ECB on order date', source: 'Etsy listing fee', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'EU', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, regulatoryPercent: 0, notes: 'FR/IT/ES/HU regulatory % applied per country when known', source: 'Etsy Fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'EU', feeType: 'payment', percent: 4, fixedPerOrder: 0.3, source: 'Etsy Payment processing (euro)', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'EU', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'US', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, source: 'Etsy Fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'US', feeType: 'payment', percent: 3, fixedPerOrder: 0.25, source: 'Etsy Payment processing', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'US', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'CA', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, regulatoryPercent: 0.5, source: 'Etsy Fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'CA', feeType: 'payment', percent: 3, fixedPerOrder: 0.25, source: 'Etsy Payment processing CA', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'CA', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'AU', feeType: 'referral', percent: 6.5, fixedPerOrder: 0, source: 'Etsy Fees', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'AU', feeType: 'payment', percent: 3, fixedPerOrder: 0.25, source: 'Etsy Payment processing AU', asOf: '2026-10-29', status: 'draft' },
  { platform: 'etsy', region: 'AU', feeType: 'listing', percent: 0, fixedPerOrder: 0.2, source: 'Etsy listing fee', asOf: '2026-10-29', status: 'draft' },
]

export const FEE_PRESETS_PENDING_SIGNOFF = true

export function regionForCountry(country: string): FeeRegion {
  const c = country.toUpperCase()
  if (c === 'GB' || c === 'UK') return 'UK'
  if (c === 'US') return 'US'
  if (c === 'CA') return 'CA'
  if (c === 'AU') return 'AU'
  return 'EU'
}

/**
 * Compared fee types by platform (v16.1 A2):
 * - Shopify: payment (when Payments export actual)
 * - Amazon: referral only (processing bundled into selling fees)
 * - Etsy: referral + payment + listing when statement provides actuals
 */
function comparedTypesForPlatform(platform: Platform): ComparedFeeType[] {
  if (platform === 'amazon') return ['referral']
  if (platform === 'shopify') return ['payment']
  if (platform === 'etsy') return ['referral', 'payment', 'listing']
  return ['referral', 'payment', 'listing']
}

export function compareFees(
  lines: {
    platform: Platform
    country: string
    lineValue: number
    shippingCharged: number
    referralFee: number
    paymentFee: number
    listingFee: number
    feesActual: { referral: boolean; payment: boolean; listing: boolean }
  }[],
  _currency: HomeCurrency,
): { comparable: boolean; excessPp: number | null; mathsNotes: string[] } {
  const mathsNotes: string[] = [
    'Fee presets are DRAFT pending Akthar sign-off (v16.1 K3).',
  ]

  if (!lines.length) return { comparable: false, excessPp: null, mathsNotes }

  // Group by platform — Fees part requires every compared type actual for lines in the comparison set
  const platforms = [...new Set(lines.map((l) => l.platform))]
  let actualFees = 0
  let presetFees = 0
  let revenue = 0
  let anyCompared = false

  for (const platform of platforms) {
    const types = comparedTypesForPlatform(platform)
    const platformLines = lines.filter((l) => l.platform === platform)
    const allActual = platformLines.every((l) =>
      types.every((t) => (t === 'referral' ? l.feesActual.referral : t === 'payment' ? l.feesActual.payment : l.feesActual.listing)),
    )
    if (!allActual) {
      mathsNotes.push(
        `${platform}: compared fee types not fully actual — Fees part / Fee drag stay off for these lines.`,
      )
      continue
    }

    anyCompared = true
    for (const l of platformLines) {
      const base = l.lineValue + l.shippingCharged
      revenue += l.lineValue
      for (const t of types) {
        if (t === 'referral') actualFees += l.referralFee
        if (t === 'payment') actualFees += l.paymentFee
        if (t === 'listing') actualFees += l.listingFee
        const region = regionForCountry(l.country)
        const preset = FEE_PRESETS.find(
          (p) => p.platform === platform && p.region === region && p.feeType === t,
        )
        if (preset) {
          const pct = preset.percent + (preset.regulatoryPercent ?? 0)
          presetFees += (pct / 100) * (t === 'referral' || t === 'payment' ? base : l.lineValue) + preset.fixedPerOrder
        }
      }
      if (platform === 'amazon') {
        mathsNotes.push(
          'Amazon referral rate depends on category (5–20%). Compared against 15% Everything else; if your category is above 15%, part of fee drag is the category standard rate (K3c).',
        )
      }
    }
  }

  if (!anyCompared || revenue <= 0) {
    return { comparable: false, excessPp: null, mathsNotes }
  }

  const actualPct = (actualFees / revenue) * 100
  const presetPct = (presetFees / revenue) * 100
  return { comparable: true, excessPp: actualPct - presetPct, mathsNotes: [...new Set(mathsNotes)] }
}
