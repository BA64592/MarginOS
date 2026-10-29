import type { HomeCurrency } from './types'

const localeFor: Record<HomeCurrency, string> = {
  GBP: 'en-GB',
  EUR: 'en-GB',
  USD: 'en-US',
  CAD: 'en-CA',
  AUD: 'en-AU',
}

export function formatMoney(value: number, currency: HomeCurrency, whole = false) {
  return new Intl.NumberFormat(localeFor[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2,
  }).format(value)
}

export function formatPct(value: number) {
  return `${value.toFixed(1)}%`
}

export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
