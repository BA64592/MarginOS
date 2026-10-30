/**
 * ECB reference FX (v16 §6) — rates vs EUR from the ECB daily reference.
 * Cross-rates via EUR. Update `asOf` when refreshing the table.
 * Source: European Central Bank euro foreign exchange reference rates.
 */
import { roundMoney } from '../money'
import type { HomeCurrency } from '../types'

/** ISO currencies we convert. Anything else is unsupported at launch. */
export const SUPPORTED_FX = new Set([
  'EUR',
  'GBP',
  'USD',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'SEK',
  'DKK',
  'NOK',
  'PLN',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'TRY',
  'NZD',
  'SGD',
  'HKD',
  'MXN',
  'ZAR',
  'INR',
  'CNY',
  'BRL',
  'KRW',
  'ILS',
])

/**
 * Units of currency per 1 EUR (ECB style). EUR = 1.
 * Snapshot for offline/SPA use — refresh periodically from ECB SDMX.
 */
export const ECB_EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  CAD: 1.48,
  AUD: 1.66,
  CHF: 0.96,
  JPY: 163.5,
  SEK: 11.5,
  DKK: 7.46,
  NOK: 11.7,
  PLN: 4.32,
  CZK: 25.3,
  HUF: 395,
  RON: 4.97,
  BGN: 1.96,
  TRY: 35.2,
  NZD: 1.8,
  SGD: 1.45,
  HKD: 8.45,
  MXN: 19.5,
  ZAR: 19.8,
  INR: 90.5,
  CNY: 7.85,
  BRL: 5.55,
  KRW: 1450,
  ILS: 4.05,
}

export const ECB_RATES_AS_OF = '2026-10-29'

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_FX.has(code.trim().toUpperCase())
}

/** Convert amount from `from` to `to` using ECB EUR cross rates. */
export function convertEcb(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = ECB_EUR_RATES,
): number | null {
  const f = from.trim().toUpperCase()
  const t = to.trim().toUpperCase()
  if (!Number.isFinite(amount)) return null
  if (f === t) return roundMoney(amount)
  const fromRate = rates[f]
  const toRate = rates[t]
  if (fromRate == null || toRate == null || fromRate === 0) return null
  // amount_from → EUR → to
  const inEur = amount / fromRate
  return roundMoney(inEur * toRate)
}

export function rateToHome(
  from: string,
  home: HomeCurrency,
  rates: Record<string, number> = ECB_EUR_RATES,
): number | null {
  const converted = convertEcb(1, from, home, rates)
  return converted
}
