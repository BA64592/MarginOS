import { convertEcb, isSupportedCurrency } from './ecb'
import { convertImportToHomeCurrency } from './convertOrders'
import type { OrderLine } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(isSupportedCurrency('gbp'), 'gbp supported')
assert(!isSupportedCurrency('XYZ'), 'xyz unsupported')

const gbp = convertEcb(100, 'EUR', 'GBP')
assert(gbp != null && gbp > 0 && gbp < 100, 'EUR→GBP')

const same = convertEcb(12.34, 'GBP', 'GBP')
assert(same === 12.34, 'same currency')

const line = {
  id: '1',
  orderId: 'o1',
  linePosition: 1,
  platform: 'shopify',
  sku: 'SKU',
  name: 'Item',
  quantity: 1,
  unitPrice: 100,
  lineValue: 100,
  orderDate: '2026-10-01',
  postingDate: '2026-10-01',
  currency: 'USD',
  country: 'US',
  region: null,
  requiresShipping: true,
  isFba: false,
  taxAmount: 0,
  marketplaceCollectedTax: false,
  shippingCharged: 10,
  shippingCost: 0,
  discount: 0,
  refundAmount: 0,
  returnExtraCost: 0,
  referralFee: 0,
  paymentFee: 0,
  listingFee: 0,
  fulfilmentFee: 0,
  conversionFee: 0,
  feesActual: { referral: false, payment: false, listing: false },
  shippingChargedAllocated: true,
  shippingCostAllocated: false,
  refundAllocated: false,
  refundUnitsEstimated: false,
} as OrderLine

const fx = convertImportToHomeCurrency([line], [], 'GBP')
assert(fx.lines.length === 1, 'converted kept')
assert(fx.lines[0].currency === 'GBP', 'home currency')
assert(fx.lines[0].lineValue !== 100, 'amount changed')
assert(fx.mathsNotes.some((m) => m.includes('ECB')), 'maths note')

const bad = {
  ...line,
  id: '2',
  currency: 'XYZ',
} as OrderLine
const dropped = convertImportToHomeCurrency([bad], [], 'GBP')
assert(dropped.lines.length === 0, 'unsupported dropped')
assert(dropped.warnings.some((w) => w.includes('XYZ')), 'names currency')

console.log('ecb.test.ts: all assertions passed')
