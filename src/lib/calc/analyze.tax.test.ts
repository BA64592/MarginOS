import { analyzeStore } from './analyze'
import type { OrderLine, ProductCostRow } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function line(partial: Partial<OrderLine> & Pick<OrderLine, 'sku' | 'lineValue'>): OrderLine {
  return {
    id: 'l1',
    orderId: 'o1',
    linePosition: 1,
    platform: 'shopify',
    name: partial.sku,
    quantity: 1,
    unitPrice: partial.lineValue,
    orderDate: '2026-01-01',
    postingDate: '2026-01-01',
    currency: 'GBP',
    country: 'GB',
    region: null,
    requiresShipping: true,
    isFba: false,
    taxAmount: 0,
    marketplaceCollectedTax: false,
    shippingCharged: 0,
    shippingCost: 0,
    discount: 0,
    refundAmount: 0,
    returnExtraCost: 0,
    referralFee: 0,
    paymentFee: 0,
    listingFee: 0,
    fulfilmentFee: 0,
    conversionFee: 0,
    feesActual: { referral: true, payment: true, listing: true },
    shippingChargedAllocated: false,
    shippingCostAllocated: false,
    refundAllocated: false,
    refundUnitsEstimated: false,
    ...partial,
  }
}

const costs: ProductCostRow[] = [
  {
    sku: 'VAT-SKU',
    name: 'VAT SKU',
    unitCost: 0,
    packagingCost: 0,
    shippingCostPerUnit: 0,
    returnCostPerReturnedUnit: 0,
    digital: false,
  },
]

const lines = [line({ sku: 'VAT-SKU', lineValue: 120, taxAmount: 20 })]

const inclusive = analyzeStore({
  lines,
  costs,
  adSpendTotal: 0,
  overheadsForPeriod: 0,
  conversionFees: 0,
  currency: 'GBP',
  targetMarginPct: 20,
  feesComparable: true,
  feesExcessPp: 0,
  pricesIncludeTax: true,
})
assert(inclusive.totals.revenue === 100, `tax-inclusive revenue expected 100 got ${inclusive.totals.revenue}`)

const exclusive = analyzeStore({
  lines,
  costs,
  adSpendTotal: 0,
  overheadsForPeriod: 0,
  conversionFees: 5,
  currency: 'GBP',
  targetMarginPct: 20,
  feesComparable: true,
  feesExcessPp: 0,
  pricesIncludeTax: false,
})
assert(exclusive.totals.revenue === 120, `tax-exclusive revenue expected 120 got ${exclusive.totals.revenue}`)
assert(
  exclusive.totals.trueProfit === exclusive.totals.contributionMargin - 5,
  'conversionFees must reduce true profit',
)

console.log('analyze.tax.test.ts: all assertions passed')
