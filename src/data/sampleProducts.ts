import { createId, emptyAdjustments } from '../lib/calc'
import type { Product, Scenario } from '../lib/types'

export const sampleProducts: Product[] = [
  {
    id: createId('prod'),
    name: 'Merino Crew Tee',
    unitsSold: 420,
    sellingPrice: 48,
    productCost: 14.5,
    shippingCost: 3.2,
    adSpend: 1850,
    platformFeePct: 12,
    returnRatePct: 6.5,
  },
  {
    id: createId('prod'),
    name: 'Trail Runner Pack',
    unitsSold: 180,
    sellingPrice: 129,
    productCost: 52,
    shippingCost: 6.8,
    adSpend: 2400,
    platformFeePct: 15,
    returnRatePct: 4.2,
  },
  {
    id: createId('prod'),
    name: 'Ceramic Pour-Over',
    unitsSold: 310,
    sellingPrice: 36,
    productCost: 11,
    shippingCost: 4.1,
    adSpend: 980,
    platformFeePct: 8,
    returnRatePct: 9.5,
  },
  {
    id: createId('prod'),
    name: 'Wool Travel Scarf',
    unitsSold: 95,
    sellingPrice: 58,
    productCost: 19,
    shippingCost: 2.8,
    adSpend: 640,
    platformFeePct: 10,
    returnRatePct: 3.1,
  },
]

export function createBlankProduct(): Product {
  return {
    id: createId('prod'),
    name: 'New product',
    unitsSold: 100,
    sellingPrice: 40,
    productCost: 15,
    shippingCost: 3,
    adSpend: 400,
    platformFeePct: 12,
    returnRatePct: 5,
  }
}

export function createScenario(name: string, products: Product[]): Scenario {
  return {
    id: createId('scn'),
    name,
    products: products.map((p) => ({ ...p, id: createId('prod') })),
    adjustments: emptyAdjustments(),
  }
}
