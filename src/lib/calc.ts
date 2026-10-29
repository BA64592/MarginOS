import { clamp } from './format'
import type {
  HealthBreakdown,
  MarginLeak,
  PortfolioResult,
  Product,
  ProductMetrics,
  ScenarioAdjustments,
} from './types'

/** Healthy e-com benchmarks used to size £ margin leaks. */
export const BENCHMARKS = {
  adsPctOfRevenue: 15,
  returnRatePct: 5,
  platformFeePct: 10,
  cogsPctOfRevenue: 35,
  shippingPctOfRevenue: 8,
  healthyMarginPct: 25,
} as const

export const FREE_PRODUCT_LIMIT = 10
export const FREE_CSV_UPLOAD_LIMIT = 1

export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function applyAdjustments(
  products: Product[],
  adjustments: ScenarioAdjustments,
): Product[] {
  return products.map((p) => ({
    ...p,
    sellingPrice: round2(p.sellingPrice * (1 + adjustments.pricePct / 100)),
    adSpend: round2(p.adSpend * (1 + adjustments.adSpendPct / 100)),
    returnRatePct: clamp(
      p.returnRatePct * (1 + adjustments.returnRatePct / 100),
      0,
      80,
    ),
    productCost: round2(p.productCost * (1 + adjustments.productCostPct / 100)),
  }))
}

export function calcProduct(product: Product): ProductMetrics {
  const units = Math.max(0, product.unitsSold)
  const price = Math.max(0, product.sellingPrice)
  const cogs = Math.max(0, product.productCost)
  const shipping = Math.max(0, product.shippingCost)
  const ads = Math.max(0, product.adSpend)
  const feePct = clamp(product.platformFeePct, 0, 40) / 100
  const returnRate = clamp(product.returnRatePct, 0, 80) / 100

  const grossRevenue = units * price
  const refunds = grossRevenue * returnRate
  const netRevenue = grossRevenue - refunds
  const productCostTotal = units * cogs
  const shippingTotal = units * shipping
  const platformFees = grossRevenue * feePct
  // Returns still consume fulfilment; partial restock assumed at 60% of COGS+shipping.
  const returnHandlingCost = units * returnRate * (cogs + shipping) * 0.6
  const trueProfit =
    netRevenue -
    productCostTotal -
    shippingTotal -
    ads -
    platformFees -
    returnHandlingCost

  const marginBase = grossRevenue || 1
  const marginPct = (trueProfit / marginBase) * 100

  return {
    product,
    grossRevenue,
    refunds,
    netRevenue,
    productCostTotal,
    shippingTotal,
    adSpend: ads,
    platformFees,
    returnHandlingCost,
    trueProfit,
    marginPct,
    costShare: {
      product: productCostTotal / marginBase,
      shipping: shippingTotal / marginBase,
      ads: ads / marginBase,
      fees: platformFees / marginBase,
      returns: (refunds + returnHandlingCost) / marginBase,
    },
  }
}

function scoreBand(value: number, good: number, ok: number, poor: number, max: number) {
  if (value <= good) return max
  if (value <= ok) return Math.round(max * 0.7)
  if (value <= poor) return Math.round(max * 0.35)
  return Math.round(max * 0.1)
}

function scoreMargin(marginPct: number, max: number) {
  if (marginPct >= 30) return max
  if (marginPct >= 20) return Math.round(max * 0.8)
  if (marginPct >= 10) return Math.round(max * 0.55)
  if (marginPct >= 0) return Math.round(max * 0.3)
  return 0
}

export function calcHealth(
  totals: PortfolioResult['totals'],
): { score: number; breakdown: HealthBreakdown } {
  const rev = totals.grossRevenue || 1
  const adsPct = (totals.adSpend / rev) * 100
  const returnPct =
    totals.grossRevenue > 0 ? (totals.refunds / totals.grossRevenue) * 100 : 0
  const feePct = (totals.platformFees / rev) * 100
  const cogsPct = (totals.productCostTotal / rev) * 100

  const breakdown: HealthBreakdown = {
    netMargin: {
      score: scoreMargin(totals.marginPct, 40),
      max: 40,
      valuePct: totals.marginPct,
      label: 'Net margin',
    },
    adEfficiency: {
      score: scoreBand(adsPct, 15, 22, 30, 20),
      max: 20,
      valuePct: adsPct,
      label: 'Ad efficiency',
    },
    returns: {
      score: scoreBand(returnPct, 5, 10, 18, 20),
      max: 20,
      valuePct: returnPct,
      label: 'Return rate',
    },
    platformFees: {
      score: scoreBand(feePct, 10, 14, 18, 10),
      max: 10,
      valuePct: feePct,
      label: 'Platform fees',
    },
    cogsRatio: {
      score: scoreBand(cogsPct, 35, 45, 55, 10),
      max: 10,
      valuePct: cogsPct,
      label: 'Product cost ratio',
    },
  }

  const score = clamp(
    breakdown.netMargin.score +
      breakdown.adEfficiency.score +
      breakdown.returns.score +
      breakdown.platformFees.score +
      breakdown.cogsRatio.score,
    0,
    100,
  )

  return { score, breakdown }
}

function leakRecommendation(area: MarginLeak['area'], impact: number): string {
  switch (area) {
    case 'ads':
      return `Cut or reallocate paid spend on weak SKUs until ads sit near ${BENCHMARKS.adsPctOfRevenue}% of revenue — recovering ~£${Math.round(impact).toLocaleString('en-GB')}/mo.`
    case 'returns':
      return `Tighten sizing/quality copy and offer exchanges before refunds to push returns toward ${BENCHMARKS.returnRatePct}% — worth ~£${Math.round(impact).toLocaleString('en-GB')}/mo.`
    case 'platformFees':
      return `Negotiate rates, shift mix to lower-fee channels, or raise AOV so fees approach ${BENCHMARKS.platformFeePct}% of sales.`
    case 'productCost':
      return `Renegotiate supplier MOQs or substitute materials so COGS trends toward ${BENCHMARKS.cogsPctOfRevenue}% of revenue.`
    case 'shipping':
      return `Consolidate carriers, raise free-shipping threshold, or pass part of fulfilment cost at checkout.`
  }
}

export function detectLeaks(metrics: ProductMetrics[], totals: PortfolioResult['totals']): MarginLeak[] {
  const leaks: MarginLeak[] = []
  const rev = totals.grossRevenue || 1

  const excessAds = Math.max(0, totals.adSpend - (BENCHMARKS.adsPctOfRevenue / 100) * rev)
  if (excessAds > 5) {
    leaks.push({
      id: 'leak_ads',
      area: 'ads',
      title: 'Ad spend above healthy benchmark',
      description: `Ads are ${((totals.adSpend / rev) * 100).toFixed(1)}% of revenue vs ${BENCHMARKS.adsPctOfRevenue}% target.`,
      monthlyImpactGbp: excessAds,
      severity: excessAds > rev * 0.08 ? 'high' : 'medium',
      recommendation: leakRecommendation('ads', excessAds),
    })
  }

  const returnRate = (totals.refunds / rev) * 100
  const excessReturnRate = Math.max(0, returnRate - BENCHMARKS.returnRatePct)
  const excessReturns =
    (excessReturnRate / 100) * rev +
    Math.max(
      0,
      totals.returnHandlingCost -
        (BENCHMARKS.returnRatePct / 100) * (totals.productCostTotal + totals.shippingTotal) * 0.6,
    )
  if (excessReturns > 5) {
    leaks.push({
      id: 'leak_returns',
      area: 'returns',
      title: 'Returns eroding net revenue',
      description: `Return rate is ${returnRate.toFixed(1)}% vs ${BENCHMARKS.returnRatePct}% healthy.`,
      monthlyImpactGbp: excessReturns,
      severity: excessReturnRate > 8 ? 'high' : excessReturnRate > 3 ? 'medium' : 'low',
      recommendation: leakRecommendation('returns', excessReturns),
    })
  }

  const feePct = (totals.platformFees / rev) * 100
  const excessFees = Math.max(0, totals.platformFees - (BENCHMARKS.platformFeePct / 100) * rev)
  if (excessFees > 5) {
    leaks.push({
      id: 'leak_fees',
      area: 'platformFees',
      title: 'Platform fees above benchmark',
      description: `Fees are ${feePct.toFixed(1)}% of gross vs ${BENCHMARKS.platformFeePct}% target.`,
      monthlyImpactGbp: excessFees,
      severity: feePct > 16 ? 'high' : 'medium',
      recommendation: leakRecommendation('platformFees', excessFees),
    })
  }

  const excessCogs = Math.max(
    0,
    totals.productCostTotal - (BENCHMARKS.cogsPctOfRevenue / 100) * rev,
  )
  if (excessCogs > 5) {
    leaks.push({
      id: 'leak_cogs',
      area: 'productCost',
      title: 'Product cost too high vs price',
      description: `COGS is ${((totals.productCostTotal / rev) * 100).toFixed(1)}% of revenue vs ${BENCHMARKS.cogsPctOfRevenue}% target.`,
      monthlyImpactGbp: excessCogs,
      severity: excessCogs > rev * 0.1 ? 'high' : 'medium',
      recommendation: leakRecommendation('productCost', excessCogs),
    })
  }

  const excessShipping = Math.max(
    0,
    totals.shippingTotal - (BENCHMARKS.shippingPctOfRevenue / 100) * rev,
  )
  if (excessShipping > 5) {
    leaks.push({
      id: 'leak_shipping',
      area: 'shipping',
      title: 'Shipping / fulfilment drag',
      description: `Shipping is ${((totals.shippingTotal / rev) * 100).toFixed(1)}% of revenue vs ${BENCHMARKS.shippingPctOfRevenue}% target.`,
      monthlyImpactGbp: excessShipping,
      severity: excessShipping > rev * 0.05 ? 'high' : 'low',
      recommendation: leakRecommendation('shipping', excessShipping),
    })
  }

  // Per-product margin killers for Pro depth
  for (const m of metrics) {
    if (m.grossRevenue < 1) continue
    if (m.marginPct < 5) {
      const impact = Math.max(0, (BENCHMARKS.healthyMarginPct / 100) * m.grossRevenue - m.trueProfit)
      if (impact > 20) {
        leaks.push({
          id: `leak_sku_${m.product.id}`,
          area: m.costShare.ads > 0.25 ? 'ads' : 'productCost',
          title: `${m.product.name} underperforming`,
          description: `True margin is ${m.marginPct.toFixed(1)}% — well below a ${BENCHMARKS.healthyMarginPct}% healthy floor.`,
          monthlyImpactGbp: impact,
          severity: m.marginPct < 0 ? 'high' : 'medium',
          recommendation:
            m.costShare.ads > 0.25
              ? `Pause or retarget ads on ${m.product.name}, or raise price until contribution margin clears 20%.`
              : `Raise price or cut COGS on ${m.product.name} until true margin clears ~20%.`,
          productId: m.product.id,
          productName: m.product.name,
        })
      }
    }
  }

  return leaks.sort((a, b) => b.monthlyImpactGbp - a.monthlyImpactGbp)
}

export function analyzePortfolio(products: Product[]): PortfolioResult {
  const metrics = products.map(calcProduct)
  const totals = metrics.reduce(
    (acc, m) => {
      acc.grossRevenue += m.grossRevenue
      acc.refunds += m.refunds
      acc.netRevenue += m.netRevenue
      acc.productCostTotal += m.productCostTotal
      acc.shippingTotal += m.shippingTotal
      acc.adSpend += m.adSpend
      acc.platformFees += m.platformFees
      acc.returnHandlingCost += m.returnHandlingCost
      acc.trueProfit += m.trueProfit
      return acc
    },
    {
      grossRevenue: 0,
      refunds: 0,
      netRevenue: 0,
      productCostTotal: 0,
      shippingTotal: 0,
      adSpend: 0,
      platformFees: 0,
      returnHandlingCost: 0,
      trueProfit: 0,
      marginPct: 0,
    },
  )
  totals.marginPct =
    totals.grossRevenue > 0 ? (totals.trueProfit / totals.grossRevenue) * 100 : 0

  const { score, breakdown } = calcHealth(totals)
  const leaks = detectLeaks(metrics, totals)
  const headlineRecommendation =
    leaks[0]?.recommendation ??
    'Margins look healthy against benchmarks — keep monitoring ads, returns and COGS monthly.'

  return {
    products: metrics,
    totals,
    healthScore: score,
    healthBreakdown: breakdown,
    leaks,
    headlineRecommendation,
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function emptyAdjustments(): ScenarioAdjustments {
  return {
    pricePct: 0,
    adSpendPct: 0,
    returnRatePct: 0,
    productCostPct: 0,
  }
}

export function healthTone(score: number): 'ok' | 'warn' | 'danger' {
  if (score >= 70) return 'ok'
  if (score >= 45) return 'warn'
  return 'danger'
}
