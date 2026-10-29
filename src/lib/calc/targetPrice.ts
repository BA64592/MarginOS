import { roundMoney } from '../money'

export interface TargetPriceInput {
  unitCost: number
  packaging: number
  perUnitShippingCost: number
  perUnitAdCost: number
  fixedFeesPerUnit: number
  percentageFees: number
  returnCostRate: number
  targetMargin: number
  perUnitShippingCharged: number
  /** When false, use alternate formula (fees not on shipping charged). */
  feesOnShippingCharged?: boolean
  taxInclusive?: boolean
  taxRate?: number
  currentAveragePrice?: number
  platformMixLabel?: string
}

export interface TargetPriceResult {
  price: number | null
  note: string
  maths: string[]
}

export function calcTargetPrice(input: TargetPriceInput): TargetPriceResult {
  const maths: string[] = []
  const pctFees = input.percentageFees
  const ret = input.returnCostRate
  const tm = input.targetMargin
  const denom = 1 - pctFees - ret - tm

  maths.push(
    `Assumes ad spend on this product stays at ${roundMoney(input.perUnitAdCost).toFixed(2)} per unit.`,
  )
  if (input.platformMixLabel) {
    maths.push(`Platform mix ${input.platformMixLabel}; assumes the mix stays the same.`)
  }

  if (denom <= 0) {
    return {
      price: null,
      note: `Can't reach the target margin at any price (fees ${ (pctFees * 100).toFixed(1) }% + returns ${(ret * 100).toFixed(1)}% + target ${(tm * 100).toFixed(1)}% ≥ 100%).`,
      maths,
    }
  }

  const top =
    input.unitCost +
    input.packaging +
    input.perUnitShippingCost +
    input.perUnitAdCost +
    input.fixedFeesPerUnit

  let raw: number
  if (input.feesOnShippingCharged === false) {
    raw =
      (top - input.perUnitShippingCharged * (1 - ret - tm)) / denom
  } else {
    // Spec §12.3: (costs) ÷ (1 − %fees − return rate − target) − shipping charged
    raw = top / denom - input.perUnitShippingCharged
  }

  maths.push(
    `Target = (${top.toFixed(2)}) ÷ (1 − ${(pctFees * 100).toFixed(2)}% − ${(ret * 100).toFixed(2)}% − ${(tm * 100).toFixed(2)}%) − ${input.perUnitShippingCharged.toFixed(2)} shipping charged.`,
  )

  if (raw <= 0) {
    return {
      price: 0.01,
      note: 'Shipping charged already covers this product’s costs',
      maths,
    }
  }

  let display = raw
  if (input.taxInclusive && (input.taxRate ?? 0) > 0) {
    display = raw * (1 + (input.taxRate as number))
    maths.push(`Prices include tax — shown price × (1 + ${(input.taxRate! * 100).toFixed(1)}%).`)
  }

  // Round up to next 0.01
  const price = Math.ceil(display * 100 - 1e-9) / 100

  if (input.currentAveragePrice != null && price <= input.currentAveragePrice + 1e-9) {
    return {
      price,
      note: `Current price already reaches your target margin (target price ${price.toFixed(2)})`,
      maths,
    }
  }

  return {
    price,
    note: `Raise price to ${price.toFixed(2)} to reach ${(tm * 100).toFixed(0)}% target margin.`,
    maths,
  }
}

export function calcBreakEvenPrice(input: Omit<TargetPriceInput, 'targetMargin'>): TargetPriceResult {
  return calcTargetPrice({ ...input, targetMargin: 0 })
}
