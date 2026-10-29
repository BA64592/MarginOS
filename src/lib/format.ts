const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const gbpExact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
})

const pct = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export function formatGbp(value: number, exact = false) {
  return (exact ? gbpExact : gbp).format(value)
}

export function formatPct(value: number) {
  return pct.format(value / 100)
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: digits,
  }).format(value)
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
