import { calcTargetPrice } from './targetPrice'

/** Spec §10.3 criterion 18 */
function assertClose(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 0.011) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`)
  }
}

const c18 = calcTargetPrice({
  unitCost: 10,
  packaging: 1,
  perUnitShippingCost: 5,
  perUnitAdCost: 2,
  fixedFeesPerUnit: 0,
  percentageFees: 0.1,
  returnCostRate: 0.05,
  targetMargin: 0.1,
  perUnitShippingCharged: 4,
  currency: 'GBP',
})
if (c18.price !== 20) throw new Error(`c18 target price expected 20, got ${c18.price}`)

// Recalculate margin at £20
const price = 20
const shipCharged = 4
const revenue = price + shipCharged
const costs = 10 + 1 + 5 + 2 + revenue * 0.1 + revenue * 0.05
const net = revenue - costs
const margin = net / revenue
assertClose(Math.round(margin * 1000) / 10, 10, 'c18 margin at target')

/** Spec §10.3 criterion 24 blended inputs */
const c24 = calcTargetPrice({
  unitCost: 11,
  packaging: 1,
  perUnitShippingCost: 2.4,
  perUnitAdCost: 1,
  fixedFeesPerUnit: 1.32,
  percentageFees: 0.0774,
  returnCostRate: 0.03,
  targetMargin: 0.1,
  perUnitShippingCharged: 0,
  platformMixLabel: '60% Shopify / 40% Amazon by revenue',
  currency: 'GBP',
})
assertClose(c24.price!, 21.1, 'c24 target price')

console.log('targetPrice tests passed')
