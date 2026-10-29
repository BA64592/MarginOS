import { formatMoney } from '../format'
import { allocateByLineValue, roundMoney, roundPct, roundWholeCurrency } from '../money'
import type {
  AnalysisResult,
  HomeCurrency,
  Leak,
  OrderLine,
  ProductCostRow,
  ProductResult,
  ProductVerdict,
  StoreTotals,
} from '../types'
import { applyHighReturnsConfidencePenalty, calcHealth } from './health'
import { calcTargetPrice } from './targetPrice'

function money(value: number, currency: HomeCurrency, whole = false) {
  return formatMoney(value, currency, whole)
}

const CURRENCY_WORD: Record<HomeCurrency, string> = {
  GBP: 'pound',
  EUR: 'euro',
  USD: 'dollar',
  CAD: 'dollar',
  AUD: 'dollar',
}

function verdictFor(netProfit: number, netMarginPct: number, revenue: number): ProductVerdict {
  if (revenue <= 0) return 'No revenue'
  if (netProfit < 0) return 'Losing money'
  const m = roundPct(netMarginPct)
  if (m <= 9.9) return 'Thin'
  return 'Healthy'
}

function daysBetween(start: string, end: string) {
  const a = new Date(start + 'T00:00:00Z').getTime()
  const b = new Date(end + 'T00:00:00Z').getTime()
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

function scaleToMonth(value: number, days: number) {
  return (value * 30) / days
}

export function analyzeStore(args: {
  lines: OrderLine[]
  costs: ProductCostRow[]
  adSpendTotal: number
  overheadsForPeriod: number
  conversionFees: number
  currency: HomeCurrency
  targetMarginPct: number
  feesComparable: boolean
  feesExcessPp: number | null
  periodStart?: string
  periodEnd?: string
}): AnalysisResult {
  const warnings: string[] = []
  const costMap = new Map(args.costs.map((c) => [c.sku, c]))
  const lines = args.lines

  if (!lines.length) {
    const emptyPeriod = { start: '', end: '', days: 30 }
    return {
      totals: {
        revenue: 0,
        productPackagingCost: 0,
        shippingCost: 0,
        shippingCharged: 0,
        netShippingCost: 0,
        shippingEligibleRevenue: 0,
        fees: 0,
        returnCost: 0,
        adSpend: args.adSpendTotal,
        conversionFees: args.conversionFees,
        overheads: args.overheadsForPeriod,
        contributionMargin: 0,
        contributionMarginPct: 0,
        trueProfit: -args.adSpendTotal - args.conversionFees - args.overheadsForPeriod,
        netMarginPct: 0,
        blendedRoas: null,
        breakEvenRoas: 'not reachable',
        breakEvenAcos: null,
        orderCount: 0,
        period: emptyPeriod,
      },
      products: [],
      health: {
        score: null,
        band: null,
        confidence: 'Low',
        confidenceReasons: ['No orders loaded.'],
        parts: [],
        maths: [],
      },
      leaks: [],
      headlineAction: 'Upload orders or add products to see true profit and leaks.',
      warnings: ['No order lines in the current dataset.'],
      shortPeriod: false,
    }
  }

  const dates = lines.map((l) => l.postingDate || l.orderDate).sort()
  const start = args.periodStart ?? dates[0]
  const end = args.periodEnd ?? dates[dates.length - 1]
  const days = daysBetween(start, end)
  const shortPeriod = days < 14
  if (shortPeriod) {
    warnings.push(
      `Period is ${days} days (< 14). Monthly figures may be unreliable and confidence is lowered.`,
    )
  }

  const filtered = lines.filter((l) => {
    const d = l.postingDate || l.orderDate
    return d >= start && d <= end
  })

  const orderIds = new Set(filtered.map((l) => l.orderId))
  const hasPhysicalNonFba = filtered.some((l) => l.requiresShipping && !l.isFba)
  const shippingCostEntered = filtered.some((l) => l.shippingCost > 0) || args.costs.some((c) => c.shippingCostPerUnit > 0)
  if (hasPhysicalNonFba && !shippingCostEntered) {
    warnings.push('Shipping cost missing for physical non-FBA orders. Shipping score part is dropped.')
  }

  // Group by SKU
  const bySku = new Map<string, OrderLine[]>()
  for (const line of filtered) {
    const list = bySku.get(line.sku) ?? []
    list.push(line)
    bySku.set(line.sku, list)
  }

  const revenueTotal = filtered.reduce((s, l) => s + l.lineValue + l.shippingCharged - l.discount, 0)
  const productRows: Omit<ProductResult, 'adSpendShare' | 'netProfit' | 'netMarginPct' | 'verdict' | 'targetPrice' | 'targetPriceNote'>[] = []

  for (const [sku, skuLines] of bySku) {
    const cost = costMap.get(sku)
    const unitsSold = skuLines.reduce((s, l) => s + l.quantity, 0)
    const revenue = roundMoney(skuLines.reduce((s, l) => s + l.lineValue + l.shippingCharged - l.discount, 0))
    const shippingCost = roundMoney(
      skuLines.reduce((s, l) => s + l.shippingCost, 0) +
        (cost && !skuLines.some((l) => l.shippingCost > 0) ? cost.shippingCostPerUnit * unitsSold : 0),
    )
    const shippingCharged = roundMoney(skuLines.reduce((s, l) => s + l.shippingCharged, 0))
    const fees = roundMoney(
      skuLines.reduce(
        (s, l) => s + l.referralFee + l.paymentFee + l.listingFee + l.fulfilmentFee,
        0,
      ),
    )
    const refunds = roundMoney(skuLines.reduce((s, l) => s + l.refundAmount, 0))
    const returnExtra = roundMoney(
      skuLines.reduce((s, l) => s + l.returnExtraCost, 0) +
        (cost
          ? skuLines.reduce((s, l) => {
              const unitsEst = l.refundUnitsEstimated
                ? Math.min(l.quantity, l.unitPrice > 0 ? l.refundAmount / l.unitPrice : 0)
                : 0
              return s + unitsEst * cost.returnCostPerReturnedUnit
            }, 0)
          : 0),
    )
    const returnCost = roundMoney(refunds + returnExtra)
    const unitCost = cost ? cost.unitCost + cost.packagingCost : 0
    const productPackagingCost = roundMoney(unitCost * unitsSold)
    const costMissing = !cost
    if (costMissing && revenue > 0) {
      // flagged later in confidence
    }

    const estimatedUnitsRefunded = skuLines.reduce((s, l) => {
      if (l.refundAmount <= 0) return s
      if (l.refundUnitsEstimated) {
        return s + Math.min(l.quantity, l.unitPrice > 0 ? l.refundAmount / l.unitPrice : 0)
      }
      // Prefer quantity if full refund heuristic
      return s + Math.min(l.quantity, l.unitPrice > 0 ? l.refundAmount / l.unitPrice : 0)
    }, 0)
    const unitReturnRate = unitsSold > 0 ? estimatedUnitsRefunded / unitsSold : 0
    const ordersCount = new Set(skuLines.map((l) => l.orderId)).size
    const cm = roundMoney(revenue - productPackagingCost - shippingCost - fees - returnCost)
    const cmPct = revenue > 0 ? (cm / revenue) * 100 : 0
    const returnCostRate = revenue > 0 ? returnCost / revenue : 0
    const platforms = [...new Set(skuLines.map((l) => l.platform))]
    const refundUnitsEstimated = skuLines.some((l) => l.refundAllocated || l.refundUnitsEstimated)

    productRows.push({
      sku,
      name: cost?.name ?? skuLines[0]?.name ?? sku,
      platforms,
      unitsSold,
      revenue,
      productPackagingCost,
      shippingCost,
      shippingCharged,
      netShippingCost: roundMoney(shippingCost - shippingCharged),
      fees,
      returnCost,
      contributionMargin: cm,
      contributionMarginPct: roundPct(cmPct),
      unitReturnRate,
      ordersCount,
      returnCostRate,
      refundUnitsEstimated,
      costMissing,
      maths: {
        revenue: `Revenue = product sales + shipping charged − discounts = ${money(revenue, args.currency)} (refunds are counted in return cost, not here).`,
        cm: `Contribution margin = revenue − product/packaging − shipping − fees − return cost = ${money(cm, args.currency)}.`,
      },
    })
  }

  // Spread ads by revenue share
  const products: ProductResult[] = productRows.map((row) => {
    const share = revenueTotal > 0 ? row.revenue / revenueTotal : 0
    const adSpendShare = roundMoney(args.adSpendTotal * share)
    const netProfit = roundMoney(row.contributionMargin - adSpendShare)
    const netMarginPct = row.revenue > 0 ? (netProfit / row.revenue) * 100 : 0
    const verdict = verdictFor(netProfit, netMarginPct, row.revenue)

    // Approximate fixed vs % — fulfilment as fixed; percentage = referral+payment+listing / revenue
    const percentageFees =
      row.revenue > 0
        ? filtered
            .filter((l) => l.sku === row.sku)
            .reduce((s, l) => s + l.referralFee + l.paymentFee + l.listingFee, 0) / row.revenue
        : 0
    const fixedFeesPerUnit =
      row.unitsSold > 0
        ? filtered.filter((l) => l.sku === row.sku).reduce((s, l) => s + l.fulfilmentFee, 0) /
          row.unitsSold
        : 0
    const cost = costMap.get(row.sku)
    const perUnitShippingCost = row.unitsSold > 0 ? row.shippingCost / row.unitsSold : 0
    const perUnitShippingCharged = row.unitsSold > 0 ? row.shippingCharged / row.unitsSold : 0
    const perUnitAdCost = row.unitsSold > 0 ? adSpendShare / row.unitsSold : 0
    const storeReturnAvg =
      productRows.filter((p) => p.sku !== row.sku).reduce((s, p) => s + p.returnCost, 0) /
        Math.max(
          1,
          productRows.filter((p) => p.sku !== row.sku).reduce((s, p) => s + p.revenue, 0),
        ) || 0
    const returnCostRate =
      row.ordersCount >= 10 ? row.returnCostRate : storeReturnAvg || row.returnCostRate

    const platformRev = new Map<string, number>()
    for (const l of filtered.filter((x) => x.sku === row.sku)) {
      platformRev.set(l.platform, (platformRev.get(l.platform) ?? 0) + l.lineValue)
    }
    const mix = [...platformRev.entries()]
      .map(([p, v]) => {
        const label =
          p === 'shopify' ? 'Shopify' : p === 'amazon' ? 'Amazon' : p === 'etsy' ? 'Etsy' : p
        return `${Math.round((v / Math.max(row.revenue, 1)) * 100)}% ${label}`
      })
      .join(' / ')

    const target = calcTargetPrice({
      unitCost: cost?.unitCost ?? 0,
      packaging: cost?.packagingCost ?? 0,
      perUnitShippingCost,
      perUnitAdCost,
      fixedFeesPerUnit,
      percentageFees,
      returnCostRate,
      targetMargin: args.targetMarginPct / 100,
      perUnitShippingCharged,
      currentAveragePrice: row.unitsSold > 0 ? row.revenue / row.unitsSold : undefined,
      platformMixLabel: mix || undefined,
      currency: args.currency,
    })

    return {
      ...row,
      adSpendShare,
      netProfit,
      netMarginPct: roundPct(netMarginPct),
      verdict,
      targetPrice: target.price,
      targetPriceNote: target.note,
      maths: {
        ...row.maths,
        net: `True profit = contribution margin − this product’s share of ad spend = ${money(netProfit, args.currency)}.`,
        target: target.maths.join(' '),
        fees: `Percentage fees ${(percentageFees * 100).toFixed(2)}% of revenue (referral + payment + listing).`,
      },
    }
  })

  const shippingEligibleRevenue = roundMoney(
    filtered
      .filter((l) => l.requiresShipping && !l.isFba)
      .reduce((s, l) => s + l.lineValue + l.shippingCharged - l.discount, 0),
  )
  const totalsBase = {
    revenue: roundMoney(revenueTotal),
    productPackagingCost: roundMoney(products.reduce((s, p) => s + p.productPackagingCost, 0)),
    shippingCost: roundMoney(products.reduce((s, p) => s + p.shippingCost, 0)),
    shippingCharged: roundMoney(products.reduce((s, p) => s + p.shippingCharged, 0)),
    fees: roundMoney(products.reduce((s, p) => s + p.fees, 0)),
    returnCost: roundMoney(products.reduce((s, p) => s + p.returnCost, 0)),
    adSpend: roundMoney(args.adSpendTotal),
    conversionFees: roundMoney(args.conversionFees),
    overheads: roundMoney(args.overheadsForPeriod),
  }
  const netShippingCost = roundMoney(totalsBase.shippingCost - totalsBase.shippingCharged)
  const cm = roundMoney(
    totalsBase.revenue -
      totalsBase.productPackagingCost -
      totalsBase.shippingCost -
      totalsBase.fees -
      totalsBase.returnCost,
  )
  const cmPct = totalsBase.revenue > 0 ? (cm / totalsBase.revenue) * 100 : 0
  const trueProfit = roundMoney(cm - totalsBase.adSpend - totalsBase.conversionFees - totalsBase.overheads)
  const netMarginPct = totalsBase.revenue > 0 ? (trueProfit / totalsBase.revenue) * 100 : 0
  const blendedRoas = totalsBase.adSpend > 0 ? totalsBase.revenue / totalsBase.adSpend : null
  const breakEvenRoas =
    cmPct <= 0 ? ('not reachable' as const) : 1 / (cmPct / 100)
  const breakEvenAcos = cmPct <= 0 ? null : cmPct

  const totals: StoreTotals = {
    ...totalsBase,
    netShippingCost,
    shippingEligibleRevenue,
    contributionMargin: cm,
    contributionMarginPct: roundPct(cmPct),
    trueProfit,
    netMarginPct: roundPct(netMarginPct),
    blendedRoas,
    breakEvenRoas,
    breakEvenAcos: breakEvenAcos == null ? null : roundPct(breakEvenAcos),
    orderCount: orderIds.size,
    period: { start, end, days },
  }

  let health = calcHealth({
    totals,
    products,
    feesComparable: args.feesComparable,
    feesExcessPp: args.feesExcessPp,
    shippingCostEntered,
    hasPhysicalNonFba,
    currencyName: CURRENCY_WORD[args.currency],
  })

  const leaks = detectLeaks({
    totals,
    products,
    targetMarginPct: args.targetMarginPct,
    feesComparable: args.feesComparable,
    feesExcessPp: args.feesExcessPp,
    currency: args.currency,
  })

  const highReturnsEstimated = leaks.some((l) => l.leakType === 'high_returns' && l.estimated)
  health = applyHighReturnsConfidencePenalty(health, highReturnsEstimated)

  const headlineAction = buildHeadlineAction(leaks, products)

  return {
    totals,
    products: products.sort((a, b) => b.revenue - a.revenue),
    health,
    leaks,
    headlineAction,
    warnings,
    shortPeriod,
  }
}

function buildHeadlineAction(leaks: Leak[], products: ProductResult[]): string {
  if (!leaks.length) {
    const best = [...products].sort((a, b) => b.netProfit - a.netProfit)[0]
    return best
      ? `${best.name}: margins look healthy — keep watching ads, returns and fees each month.`
      : 'Your margins look healthy — keep watching ads, returns and fees each month.'
  }
  const top = leaks[0]
  const named =
    top.productName ||
    [...products].sort((a, b) => a.netProfit - b.netProfit)[0]?.name ||
    products[0]?.name
  if (!named) return top.recommendation
  if (top.recommendation.startsWith(`${named}:`) || top.recommendation.startsWith(`${named} `)) {
    return top.recommendation
  }
  return `${named}: ${top.recommendation}`
}

function detectLeaks(args: {
  totals: StoreTotals
  products: ProductResult[]
  targetMarginPct: number
  feesComparable: boolean
  feesExcessPp: number | null
  currency: HomeCurrency
}): Leak[] {
  const { totals, products, targetMarginPct, feesComparable, feesExcessPp, currency } = args
  const days = totals.period.days
  const leaks: Leak[] = []
  const moneyWord = CURRENCY_WORD[currency]

  // Unprofitable ads
  const be = totals.breakEvenRoas
  const triggerAds =
    totals.adSpend > 0 &&
    (totals.contributionMarginPct <= 0 ||
      (typeof be === 'number' && totals.blendedRoas != null && totals.blendedRoas < be))
  if (triggerAds) {
    const cmFloor = Math.max(0, totals.contributionMargin)
    const impact = roundWholeCurrency(scaleToMonth(Math.max(0, totals.adSpend - cmFloor), days))
    leaks.push({
      id: 'leak_ads',
      leakType: 'unprofitable_ads',
      title: 'Unprofitable ads',
      description:
        totals.contributionMarginPct <= 0
          ? `Contribution margin is ${totals.contributionMarginPct.toFixed(1)}% with ad spend.`
          : `Blended ROAS ${totals.blendedRoas?.toFixed(2)}× is below break-even ${typeof be === 'number' ? be.toFixed(2) : be}×.`,
      monthlyImpact: impact,
      recommendation:
        totals.contributionMarginPct <= 0
          ? `Fix pricing and costs first — every ad ${moneyWord} loses money.`
          : `Reduce or pause spend until ROAS reaches break-even ${typeof be === 'number' ? be.toFixed(2) : be}×.`,
      maths: [
        `Impact = ad spend − max(contribution margin, 0), scaled to 30 days → ${money(impact, currency, true)}.`,
      ],
    })
  }

  // High returns (product-level)
  for (const p of products) {
    if (p.ordersCount < 10) continue
    const others = products.filter((x) => x.sku !== p.sku)
    const storeAvg =
      others.length === 0
        ? null
        : others.reduce((s, x) => s + x.unitReturnRate * x.unitsSold, 0) /
          Math.max(1, others.reduce((s, x) => s + x.unitsSold, 0))
    // Spec: above 2× store average OR above 15%. If avg is 0% or can't be calculated, only the 15% test.
    const only15 = storeAvg == null || storeAvg === 0
    const fire = only15
      ? p.unitReturnRate > 0.15
      : p.unitReturnRate > 2 * (storeAvg as number) || p.unitReturnRate > 0.15
    if (!fire) continue

    const targetRate = only15 ? 0.15 : Math.min(storeAvg as number, 0.15)
    const impact = roundWholeCurrency(
      scaleToMonth(
        Math.max(0, p.returnCost * (1 - targetRate / Math.max(p.unitReturnRate, 1e-9))),
        days,
      ),
    )
    leaks.push({
      id: `leak_returns_${p.sku}`,
      leakType: 'high_returns',
      title: `High returns — ${p.name}`,
      description: `Unit return rate ${(p.unitReturnRate * 100).toFixed(1)}% (target ${(targetRate * 100).toFixed(1)}%).`,
      monthlyImpact: impact,
      recommendation: `Review sizing, photos and descriptions; profit gained at the target rate ≈ ${money(impact, currency, true)} / month.`,
      productSku: p.sku,
      productName: p.name,
      estimated: p.refundUnitsEstimated,
      maths: [
        p.refundUnitsEstimated ? 'Units refunded estimated from refund amount.' : 'Units refunded from line data.',
        `Impact = return cost × (1 − target ÷ product rate), ×30/days → ${money(impact, currency, true)}.`,
      ],
    })
  }

  // Loss-making product
  for (const p of products) {
    if (p.verdict !== 'Losing money' && p.verdict !== 'No revenue') continue
    // For No revenue: monthly costs; for losing: monthly loss
    const monthlyLoss =
      p.verdict === 'No revenue'
        ? roundWholeCurrency(
            scaleToMonth(
              p.productPackagingCost + p.shippingCost + p.fees + p.returnCost + p.adSpendShare,
              days,
            ),
          )
        : roundWholeCurrency(scaleToMonth(Math.max(0, -p.netProfit), days))
    leaks.push({
      id: `leak_loss_${p.sku}`,
      leakType: 'loss_making_product',
      title:
        p.verdict === 'No revenue'
          ? `No revenue — ${p.name}`
          : `Loss-making product — ${p.name}`,
      description:
        p.verdict === 'No revenue'
          ? 'Costs with no revenue in the period (samples/replacements).'
          : `Net profit ${money(p.netProfit, currency)} (${p.netMarginPct.toFixed(1)}%).`,
      monthlyImpact: monthlyLoss,
      recommendation:
        p.verdict === 'No revenue'
          ? `Stop sending free samples/replacements or charge for them (monthly cost ≈ ${money(monthlyLoss, currency, true)}).`
          : p.targetPrice != null && !p.targetPriceNote.startsWith('Current price')
            ? `Raise price to ${money(p.targetPrice, currency)}, or discontinue.`
            : p.targetPriceNote || 'Raise price or discontinue.',
      productSku: p.sku,
      productName: p.name,
      maths: [`Monthly loss scaled to 30 days → ${money(monthlyLoss, currency, true)}.`],
    })
  }

  // Shipping subsidy
  if (totals.shippingEligibleRevenue > 0 && totals.shippingCost > 0) {
    const threshold = 0.05 * totals.shippingEligibleRevenue
    if (totals.netShippingCost > threshold) {
      const impact = roundWholeCurrency(scaleToMonth(totals.netShippingCost - threshold, days))
      const orders = Math.max(1, totals.orderCount)
      const perOrder = roundMoney(impact / orders)
      leaks.push({
        id: 'leak_shipping',
        leakType: 'shipping_subsidy',
        title: 'Shipping subsidy',
        description: `Net shipping is ${((totals.netShippingCost / totals.shippingEligibleRevenue) * 100).toFixed(1)}% of shipping-eligible revenue (trigger > 5%).`,
        monthlyImpact: impact,
        recommendation: `Raise free-shipping threshold or add a shipping charge — about ${money(perOrder, currency)} to recover per order (monthly).`,
        maths: [
          `Impact = net shipping − 5% of shipping-eligible revenue, ×30/days → ${money(impact, currency, true)}.`,
        ],
      })
    }
  }

  // Fee drag
  if (feesComparable && feesExcessPp != null && feesExcessPp > 1) {
    const impact = roundWholeCurrency(
      scaleToMonth(((feesExcessPp - 0) / 100) * totals.revenue, days),
    )
    leaks.push({
      id: 'leak_fees',
      leakType: 'fee_drag',
      title: 'Fee drag',
      description: `Actual compared fees are ${feesExcessPp.toFixed(1)} pp above the matching preset.`,
      monthlyImpact: impact,
      recommendation: `Review fee plan or payment settings — excess fees ≈ ${money(impact, currency, true)} / month.`,
      maths: [`Impact = excess fee pp × revenue, scaled to 30 days → ${money(impact, currency, true)}.`],
    })
  }

  // Thin pricing
  for (const p of products) {
    if (p.verdict !== 'Thin') continue
    if (p.netMarginPct >= targetMarginPct) continue
    const impact = roundWholeCurrency(
      scaleToMonth(((targetMarginPct - p.netMarginPct) / 100) * p.revenue, days),
    )
    const raise =
      p.targetPrice != null && p.targetPriceNote.startsWith('Current price')
        ? p.targetPriceNote
        : p.targetPrice != null
          ? `Raise price to ${money(p.targetPrice, currency)}.`
          : p.targetPriceNote
    leaks.push({
      id: `leak_thin_${p.sku}`,
      leakType: 'thin_pricing',
      title: `Thin pricing — ${p.name}`,
      description: `Net margin ${p.netMarginPct.toFixed(1)}% is below your ${targetMarginPct.toFixed(0)}% target.`,
      monthlyImpact: impact,
      recommendation: raise,
      productSku: p.sku,
      productName: p.name,
      maths: [
        `Impact = (target margin − product margin) × revenue, ×30/days → ${money(impact, currency, true)}.`,
      ],
    })
  }

  return leaks.sort((a, b) => b.monthlyImpact - a.monthlyImpact)
}

/** Build demo order lines that exercise allocation + multi-platform target price. */
export function buildSampleDataset(currency: HomeCurrency = 'GBP'): {
  lines: OrderLine[]
  costs: ProductCostRow[]
  adSpend: number
} {
  const costs: ProductCostRow[] = [
    {
      sku: 'MERINO-TEE',
      name: 'Merino Crew Tee',
      unitCost: 11,
      packagingCost: 1,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 2,
      digital: false,
    },
    {
      sku: 'TRAIL-PACK',
      name: 'Trail Runner Pack',
      unitCost: 42,
      packagingCost: 2,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 4,
      digital: false,
    },
    {
      sku: 'POUR-OVER',
      name: 'Ceramic Pour-Over',
      unitCost: 9,
      packagingCost: 1,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 2.5,
      digital: false,
    },
    {
      sku: 'SCARF',
      name: 'Wool Travel Scarf',
      unitCost: 16,
      packagingCost: 1,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 1.5,
      digital: false,
    },
  ]

  const lines: OrderLine[] = []
  let id = 0
  const pushLine = (partial: Omit<OrderLine, 'id' | 'isSample'>) => {
    lines.push({ ...partial, id: `line_${++id}`, isSample: true })
  }

  // Acceptance §10.3.18 style product on Shopify — mug-like tee economics at scale
  // 60 Shopify units Merino at £20 + 40 Amazon FBA at £20 for multi-platform blend demo on MERINO
  for (let i = 0; i < 60; i++) {
    const orderId = `S-${1000 + i}`
    pushLine({
      orderId,
      linePosition: 1,
      platform: 'shopify',
      sku: 'MERINO-TEE',
      name: 'Merino Crew Tee',
      quantity: 1,
      unitPrice: 20,
      lineValue: 20,
      orderDate: '2026-09-10',
      postingDate: '2026-09-10',
      currency,
      country: 'GB',
      region: null,
      requiresShipping: true,
      isFba: false,
      taxAmount: 0,
      marketplaceCollectedTax: false,
      shippingCharged: 0,
      shippingCost: 4,
      discount: 0,
      refundAmount: 0,
      returnExtraCost: 0,
      referralFee: roundMoney(20 * 0.029),
      paymentFee: 0.2,
      listingFee: 0,
      fulfilmentFee: 0,
      conversionFee: 0,
      feesActual: { referral: true, payment: true, listing: false },
      shippingChargedAllocated: false,
      shippingCostAllocated: false,
      refundAllocated: false,
      refundUnitsEstimated: false,
    })
  }
  for (let i = 0; i < 40; i++) {
    pushLine({
      orderId: `A-${2000 + i}`,
      linePosition: 1,
      platform: 'amazon',
      sku: 'MERINO-TEE',
      name: 'Merino Crew Tee',
      quantity: 1,
      unitPrice: 20,
      lineValue: 20,
      orderDate: '2026-09-12',
      postingDate: '2026-09-12',
      currency,
      country: 'GB',
      region: null,
      requiresShipping: true,
      isFba: true,
      taxAmount: 0,
      marketplaceCollectedTax: true,
      shippingCharged: 0,
      shippingCost: 0,
      discount: 0,
      refundAmount: i < 3 ? 20 : 0,
      returnExtraCost: 0,
      referralFee: roundMoney(20 * 0.15),
      paymentFee: 0,
      listingFee: 0,
      fulfilmentFee: 3,
      conversionFee: 0,
      feesActual: { referral: true, payment: true, listing: true },
      shippingChargedAllocated: false,
      shippingCostAllocated: false,
      refundAllocated: false,
      refundUnitsEstimated: false,
    })
  }

  // Trail pack — thinner margin
  for (let i = 0; i < 80; i++) {
    pushLine({
      orderId: `S-T-${i}`,
      linePosition: 1,
      platform: 'shopify',
      sku: 'TRAIL-PACK',
      name: 'Trail Runner Pack',
      quantity: 1,
      unitPrice: 24,
      lineValue: 24,
      orderDate: '2026-09-08',
      postingDate: '2026-09-08',
      currency,
      country: 'GB',
      region: null,
      requiresShipping: true,
      isFba: false,
      taxAmount: 0,
      marketplaceCollectedTax: false,
      shippingCharged: 3,
      shippingCost: 6.5,
      discount: 0,
      refundAmount: i < 12 ? 24 : 0,
      returnExtraCost: i < 12 ? 3 : 0,
      referralFee: 0,
      paymentFee: roundMoney(24 * 0.015 + 0.2),
      listingFee: 0,
      fulfilmentFee: 0,
      conversionFee: 0,
      feesActual: { referral: false, payment: true, listing: false },
      shippingChargedAllocated: false,
      shippingCostAllocated: false,
      refundAllocated: false,
      refundUnitsEstimated: true,
    })
  }

  // Pour-over — healthy
  for (let i = 0; i < 120; i++) {
    pushLine({
      orderId: `E-${i}`,
      linePosition: 1,
      platform: 'etsy',
      sku: 'POUR-OVER',
      name: 'Ceramic Pour-Over',
      quantity: 1,
      unitPrice: 36,
      lineValue: 36,
      orderDate: '2026-09-05',
      postingDate: '2026-09-05',
      currency,
      country: 'GB',
      region: null,
      requiresShipping: true,
      isFba: false,
      taxAmount: 0,
      marketplaceCollectedTax: false,
      shippingCharged: 4,
      shippingCost: 3.2,
      discount: 0,
      refundAmount: i < 4 ? 36 : 0,
      returnExtraCost: 0,
      referralFee: roundMoney(36 * 0.065),
      paymentFee: roundMoney(36 * 0.04 + 0.25),
      listingFee: 0.2,
      fulfilmentFee: 0,
      conversionFee: 0,
      feesActual: { referral: false, payment: true, listing: false },
      shippingChargedAllocated: false,
      shippingCostAllocated: false,
      refundAllocated: false,
      refundUnitsEstimated: false,
    })
  }

  // Scarf
  for (let i = 0; i < 50; i++) {
    pushLine({
      orderId: `S-S-${i}`,
      linePosition: 1,
      platform: 'shopify',
      sku: 'SCARF',
      name: 'Wool Travel Scarf',
      quantity: 1,
      unitPrice: 58,
      lineValue: 58,
      orderDate: '2026-09-15',
      postingDate: '2026-09-15',
      currency,
      country: 'GB',
      region: null,
      requiresShipping: true,
      isFba: false,
      taxAmount: 0,
      marketplaceCollectedTax: false,
      shippingCharged: 2.5,
      shippingCost: 2.8,
      discount: 0,
      refundAmount: 0,
      returnExtraCost: 0,
      referralFee: 0,
      paymentFee: roundMoney(58 * 0.015 + 0.2),
      listingFee: 0,
      fulfilmentFee: 0,
      conversionFee: 0,
      feesActual: { referral: false, payment: true, listing: false },
      shippingChargedAllocated: false,
      shippingCostAllocated: false,
      refundAllocated: false,
      refundUnitsEstimated: false,
    })
  }

  // Demo allocation order: mug £10 + print £40 with £6 shipping + 20p fee
  {
    const values = [10, 40]
    const ship = allocateByLineValue(6, values)
    const fee = allocateByLineValue(0.2, values)
    ;['ALLOC-MUG', 'ALLOC-PRINT'].forEach((sku, idx) => {
      pushLine({
        orderId: 'ALLOC-1',
        linePosition: idx + 1,
        platform: 'shopify',
        sku,
        name: sku === 'ALLOC-MUG' ? 'Demo Mug' : 'Demo Print',
        quantity: 1,
        unitPrice: values[idx],
        lineValue: values[idx],
        orderDate: '2026-09-20',
        postingDate: '2026-09-20',
        currency,
        country: 'GB',
        region: null,
        requiresShipping: true,
        isFba: false,
        taxAmount: 0,
        marketplaceCollectedTax: false,
        shippingCharged: 0,
        shippingCost: ship[idx],
        discount: 0,
        refundAmount: 0,
        returnExtraCost: 0,
        referralFee: 0,
        paymentFee: fee[idx],
        listingFee: 0,
        fulfilmentFee: 0,
        conversionFee: 0,
        feesActual: { referral: false, payment: true, listing: false },
        shippingChargedAllocated: false,
        shippingCostAllocated: true,
        refundAllocated: false,
        refundUnitsEstimated: false,
      })
    })
    costs.push(
      {
        sku: 'ALLOC-MUG',
        name: 'Demo Mug',
        unitCost: 3,
        packagingCost: 0.5,
        shippingCostPerUnit: 0,
        returnCostPerReturnedUnit: 1,
        digital: false,
      },
      {
        sku: 'ALLOC-PRINT',
        name: 'Demo Print',
        unitCost: 8,
        packagingCost: 1,
        shippingCostPerUnit: 0,
        returnCostPerReturnedUnit: 1,
        digital: false,
      },
    )
  }

  // Keep store-level health in a credible range while leaving some Thin / Losing SKUs for demos.
  return {
    lines,
    costs: costs.map((c) => ({ ...c, isSample: true })),
    adSpend: 1600,
  }
}

export function applyScenarioToLines(
  lines: OrderLine[],
  costs: ProductCostRow[],
  adSpend: number,
  adj: {
    pricePct: number
    productCostPct: number
    adSpendPct: number
    returnRatePct: number
    shippingChargePct: number
    discountPct: number
  },
): { lines: OrderLine[]; costs: ProductCostRow[]; adSpend: number } {
  const nextLines = lines.map((l) => {
    const priceMul = 1 + adj.pricePct / 100
    const shipChargeMul = 1 + adj.shippingChargePct / 100
    const discountMul = 1 + adj.discountPct / 100
    const returnMul = 1 + adj.returnRatePct / 100
    const unitPrice = roundMoney(l.unitPrice * priceMul)
    const lineValue = roundMoney(l.lineValue * priceMul)
    return {
      ...l,
      unitPrice,
      lineValue,
      shippingCharged: roundMoney(l.shippingCharged * shipChargeMul),
      discount: roundMoney(l.discount * discountMul + lineValue * Math.max(0, adj.discountPct) / 100),
      refundAmount: roundMoney(l.refundAmount * returnMul * priceMul),
      returnExtraCost: roundMoney(l.returnExtraCost * returnMul),
      referralFee: roundMoney(l.referralFee * priceMul),
      paymentFee: roundMoney(l.paymentFee * priceMul),
    }
  })
  const nextCosts = costs.map((c) => ({
    ...c,
    unitCost: roundMoney(c.unitCost * (1 + adj.productCostPct / 100)),
    packagingCost: roundMoney(c.packagingCost * (1 + adj.productCostPct / 100)),
  }))
  return {
    lines: nextLines,
    costs: nextCosts,
    adSpend: roundMoney(adSpend * (1 + adj.adSpendPct / 100)),
  }
}
