import { analyzeStore } from '../calc/analyze'
import { DEMO_STORES, buildDemoStore } from './stores'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

for (const meta of DEMO_STORES) {
  const s = buildDemoStore(meta.id, 'GBP')
  const adSpendTotal = s.ads.reduce((a, x) => a + x.amount, 0)
  const result = analyzeStore({
    lines: s.lines,
    costs: s.costs,
    adSpendTotal,
    overheadsForPeriod: 0,
    conversionFees: 0,
    currency: 'GBP',
    targetMarginPct: 20,
    feesComparable: true,
    feesExcessPp: 0,
  })
  assert(result.products.length >= 3, `${meta.id}: products`)
  assert(result.totals.revenue > 0, `${meta.id}: revenue`)
  assert(Number.isFinite(result.health.score), `${meta.id}: score`)

  if (meta.id === 'store_a_shopify') {
    assert((result.health.score ?? 0) >= 55, 'A: healthy score')
    const gift = result.products.find((p) => p.sku === 'GIFT-BOX')
    assert((gift?.netProfit ?? 0) < 0, 'A: gift box loses money')
    assert(result.products.filter((p) => p.netProfit > 0).length >= 2, 'A: winners')
  }
  if (meta.id === 'store_b_amazon') {
    assert((result.health.score ?? 0) < 55, 'B: low score')
    assert(result.leaks.length >= 2, 'B: several leaks')
    assert(result.products.some((p) => p.netProfit < 0), 'B: losers')
  }
  if (meta.id === 'store_c_etsy') {
    const score = result.health.score ?? 0
    assert(score >= 35 && score < 85, `C: mid score got ${score}`)
    const mug = result.products.find((p) => p.sku === 'MUG-CUSTOM')
    assert(mug != null && mug.netProfit < 0, 'C: mug looks profitable but loses')
    assert(result.products.some((p) => p.netProfit > 0), 'C: winners')
  }
  if (meta.id === 'store_multi') {
    const platforms = new Set(s.lines.map((l) => l.platform))
    assert(platforms.has('shopify') && platforms.has('amazon') && platforms.has('etsy'), 'multi platforms')
  }
}

console.log('stores.test.ts: all assertions passed')
