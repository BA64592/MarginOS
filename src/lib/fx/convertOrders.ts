import type { AdSpendEntry, HomeCurrency, OrderLine } from '../types'
import { convertEcb, ECB_RATES_AS_OF, isSupportedCurrency } from './ecb'

const MONEY_KEYS: (keyof OrderLine)[] = [
  'unitPrice',
  'lineValue',
  'taxAmount',
  'shippingCharged',
  'shippingCost',
  'discount',
  'refundAmount',
  'returnExtraCost',
  'referralFee',
  'paymentFee',
  'listingFee',
  'fulfilmentFee',
  'conversionFee',
]

export type FxConvertResult = {
  lines: OrderLine[]
  ads: AdSpendEntry[]
  warnings: string[]
  mathsNotes: string[]
  excludedCurrencies: string[]
}

/** Convert imported rows into home currency; drop unsupported currencies (§6). */
export function convertImportToHomeCurrency(
  lines: OrderLine[],
  ads: AdSpendEntry[],
  home: HomeCurrency,
  conversionFeePct = 0,
): FxConvertResult {
  const warnings: string[] = []
  const mathsNotes: string[] = []
  const excluded = new Set<string>()
  const kept: OrderLine[] = []
  let convertedCount = 0

  for (const line of lines) {
    const cur = String(line.currency || home).toUpperCase()
    if (!isSupportedCurrency(cur)) {
      excluded.add(cur)
      continue
    }
    if (cur === home) {
      kept.push({ ...line, currency: home })
      continue
    }
    const rate = convertEcb(1, cur, home)
    if (rate == null) {
      excluded.add(cur)
      continue
    }
    const next: OrderLine = { ...line, currency: home }
    for (const key of MONEY_KEYS) {
      const v = next[key]
      if (typeof v === 'number') {
        const converted = convertEcb(v, cur, home)
        if (converted != null) {
          next[key] = converted as never
        }
      }
    }
    if (conversionFeePct > 0 && next.lineValue > 0) {
      next.conversionFee = Math.round(next.lineValue * (conversionFeePct / 100) * 100) / 100
    }
    kept.push(next)
    convertedCount++
  }

  const keptAds = ads.map((a) => ({ ...a }))

  if (convertedCount > 0) {
    mathsNotes.push(
      `Currency conversion: ${convertedCount} line(s) converted to ${home} using ECB reference rates (as of ${ECB_RATES_AS_OF}).`,
    )
  }
  if (excluded.size) {
    const list = [...excluded].sort().join(', ')
    warnings.push(
      `Orders in unsupported currencies were left out of results: ${list}.`,
    )
  }

  return {
    lines: kept,
    ads: keptAds,
    warnings,
    mathsNotes,
    excludedCurrencies: [...excluded],
  }
}
