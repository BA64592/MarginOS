import { roundScore } from '../money'
import type {
  Confidence,
  HealthPartResult,
  HealthResult,
  ProductResult,
  ScoreBand,
  StoreTotals,
} from '../types'

function lerpScore(value: number, good: number, bad: number, higherIsBetter: boolean): number {
  if (higherIsBetter) {
    if (value >= good) return 100
    if (value <= bad) return 0
    return ((value - bad) / (good - bad)) * 100
  }
  if (value <= good) return 100
  if (value >= bad) return 0
  return ((bad - value) / (bad - good)) * 100
}

function adEfficiencyScore(blendedRoas: number | null, breakEvenRoas: number | null | 'not reachable'): number {
  if (breakEvenRoas === 'not reachable') return 0
  if (blendedRoas == null || breakEvenRoas == null || breakEvenRoas <= 0) return 0
  const ratio = blendedRoas / breakEvenRoas
  if (ratio <= 0.75) return 0
  if (ratio >= 1.5) return 100
  if (ratio <= 1) {
    // 0.75 → 0, 1.0 → 50
    return ((ratio - 0.75) / 0.25) * 50
  }
  // 1.0 → 50, 1.5 → 100
  return 50 + ((ratio - 1) / 0.5) * 50
}

function bandFor(score: number): ScoreBand {
  if (score >= 80) return 'Strong'
  if (score >= 50) return 'Needs attention'
  return 'At risk'
}

function dropConfidence(level: Confidence): Confidence {
  if (level === 'High') return 'Medium'
  return 'Low'
}

export function calcHealth(args: {
  totals: StoreTotals
  products: ProductResult[]
  feesComparable: boolean
  feesExcessPp: number | null
  shippingCostEntered: boolean
  hasPhysicalNonFba: boolean
  currencyName: string
}): HealthResult {
  const { totals, products, feesComparable, feesExcessPp, shippingCostEntered, hasPhysicalNonFba, currencyName } =
    args
  const maths: string[] = []
  const confidenceReasons: string[] = []
  let confidence: Confidence = 'High'

  if (totals.revenue <= 0) {
    return {
      score: null,
      band: null,
      confidence: 'Low',
      confidenceReasons: ['Revenue is 0 — check the file.'],
      parts: [],
      maths: ['No Health Score when store revenue is 0.'],
    }
  }

  const parts: HealthPartResult[] = []

  // Net margin 35%
  parts.push({
    key: 'netMargin',
    label: 'Net margin',
    weight: 35,
    score: roundScore(lerpScore(totals.netMarginPct, 20, 0, true)),
    dropped: false,
    detail: `Net margin ${totals.netMarginPct.toFixed(1)}% (100 at ≥20%, 0 at ≤0%).`,
  })

  // Ad efficiency 20%
  if (totals.adSpend <= 0) {
    parts.push({
      key: 'adEfficiency',
      label: 'Ad efficiency',
      weight: 20,
      score: null,
      dropped: true,
      dropReason: 'No ads in the period (not applicable).',
      detail: 'Dropped — no ad spend.',
    })
  } else if (totals.contributionMarginPct <= 0) {
    parts.push({
      key: 'adEfficiency',
      label: 'Ad efficiency',
      weight: 20,
      score: 0,
      dropped: false,
      detail: `Every ad ${currencyName.toLowerCase()} loses money (contribution margin ≤ 0% with ad spend).`,
    })
  } else {
    const score = roundScore(adEfficiencyScore(totals.blendedRoas, totals.breakEvenRoas))
    parts.push({
      key: 'adEfficiency',
      label: 'Ad efficiency',
      weight: 20,
      score,
      dropped: false,
      detail: `Blended ROAS ${totals.blendedRoas?.toFixed(2) ?? '—'}× vs break-even ${
        totals.breakEvenRoas === 'not reachable'
          ? 'not reachable'
          : `${(totals.breakEvenRoas as number).toFixed(2)}×`
      }.`,
    })
  }

  // Returns 15%
  const returnCostPct = (totals.returnCost / totals.revenue) * 100
  parts.push({
    key: 'returns',
    label: 'Returns',
    weight: 15,
    score: roundScore(lerpScore(returnCostPct, 3, 15, false)),
    dropped: false,
    detail: `Return cost ${returnCostPct.toFixed(1)}% of revenue (100 at ≤3%, 0 at ≥15%).`,
  })

  // Product mix 10%
  const badRevenue = products
    .filter((p) => p.verdict === 'Losing money' || p.verdict === 'Thin')
    .reduce((s, p) => s + p.revenue, 0)
  const badShare = (badRevenue / totals.revenue) * 100
  parts.push({
    key: 'productMix',
    label: 'Product mix',
    weight: 10,
    score: roundScore(lerpScore(badShare, 0, 50, false)),
    dropped: false,
    detail: `${badShare.toFixed(1)}% of revenue from Losing money or Thin products.`,
  })

  // Fees 10%
  if (!feesComparable || feesExcessPp == null) {
    parts.push({
      key: 'fees',
      label: 'Fees',
      weight: 10,
      score: null,
      dropped: true,
      dropReason: 'Fees estimated or incomplete actual fee types — Fees part only uses fully actual compared fees.',
      detail: 'Dropped — estimated fees.',
    })
    confidence = dropConfidence(confidence)
    confidenceReasons.push('Fees part dropped because fee data is estimated or incomplete.')
  } else {
    parts.push({
      key: 'fees',
      label: 'Fees',
      weight: 10,
      score: roundScore(lerpScore(feesExcessPp, 1, 10, false)),
      dropped: false,
      detail: `Actual fees ${feesExcessPp.toFixed(1)} pp above matching preset (100 at ≤1 pp, 0 at ≥10 pp).`,
    })
  }

  // Shipping 10%
  const allDigitalOrFba = !hasPhysicalNonFba
  if (allDigitalOrFba || !shippingCostEntered) {
    const notApplicable = allDigitalOrFba
    parts.push({
      key: 'shipping',
      label: 'Shipping',
      weight: 10,
      score: null,
      dropped: true,
      dropReason: notApplicable
        ? 'No shipping-eligible orders (digital or FBA only).'
        : 'Shipping cost missing for physical non-FBA orders.',
      detail: notApplicable ? 'Dropped — not applicable.' : 'Dropped — shipping cost missing.',
    })
    if (!notApplicable) {
      confidence = dropConfidence(confidence)
      confidenceReasons.push('Shipping cost missing for physical non-FBA orders.')
    }
  } else {
    const base = totals.shippingEligibleRevenue || 1
    const netShipPct = (totals.netShippingCost / base) * 100
    parts.push({
      key: 'shipping',
      label: 'Shipping',
      weight: 10,
      score: roundScore(lerpScore(netShipPct, 5, 15, false)),
      dropped: false,
      detail: `Net shipping ${netShipPct.toFixed(1)}% of shipping-eligible revenue.`,
    })
  }

  const active = parts.filter((p) => !p.dropped && p.score != null)
  const weightSum = active.reduce((s, p) => s + p.weight, 0)
  let score: number | null = null
  if (active.length && weightSum > 0) {
    const weighted = active.reduce((s, p) => s + (p.score as number) * (p.weight / weightSum), 0)
    score = roundScore(weighted)
    maths.push(
      `Rescaled weights over ${active.length} parts (total weight ${weightSum}). Weighted score → ${score}.`,
    )
  }

  if (totals.period.days < 14) {
    confidence = dropConfidence(confidence)
    confidenceReasons.push('Period under 14 days.')
  }
  if (totals.orderCount < 30) {
    confidence = dropConfidence(confidence)
    confidenceReasons.push('Fewer than 30 orders in the period (small sample).')
  }
  const missingCostRev = products.filter((p) => p.costMissing).reduce((s, p) => s + p.revenue, 0)
  if (totals.revenue > 0 && missingCostRev / totals.revenue > 0.1) {
    confidence = dropConfidence(confidence)
    confidenceReasons.push('Products with cost missing make up more than 10% of revenue.')
  }

  return {
    score,
    band: score == null ? null : bandFor(score),
    confidence,
    confidenceReasons,
    parts,
    maths,
  }
}

export function applyHighReturnsConfidencePenalty(
  health: HealthResult,
  highReturnsUsesEstimatedUnits: boolean,
): HealthResult {
  if (!highReturnsUsesEstimatedUnits) return health
  const confidence =
    health.confidence === 'High' ? 'Medium' : health.confidence === 'Medium' ? 'Low' : 'Low'
  return {
    ...health,
    confidence,
    confidenceReasons: [
      ...health.confidenceReasons,
      'High returns leak uses units refunded estimated from refund amounts.',
    ],
  }
}
