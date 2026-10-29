/**
 * Built-in tax rates — sources from amendment v16.1 A3.
 * Estimates, not tax advice. US: no assumed rates (export only).
 */
export type TaxRateRow = {
  country: string
  province: string | null
  rateType: 'standard' | 'reduced' | 'zero' | 'gst' | 'hst' | 'pst'
  rate: number
  validFrom: string
  validTo: string | null
  source: string
  checkedOn: string
}

export const TAX_RATES: TaxRateRow[] = [
  {
    country: 'GB',
    province: null,
    rateType: 'standard',
    rate: 0.2,
    validFrom: '2011-01-04',
    validTo: null,
    source: 'GOV.UK VAT rates / HMRC',
    checkedOn: '2026-10-29',
  },
  {
    country: 'GB',
    province: null,
    rateType: 'reduced',
    rate: 0.05,
    validFrom: '2011-01-04',
    validTo: null,
    source: 'GOV.UK VAT rates',
    checkedOn: '2026-10-29',
  },
  // EU sample standards — full TEDB table to be filled; several rates changed 2024–2025
  { country: 'IE', province: null, rateType: 'standard', rate: 0.23, validFrom: '2012-01-01', validTo: null, source: 'EC TEDB / VAT rates page', checkedOn: '2026-10-29' },
  { country: 'DE', province: null, rateType: 'standard', rate: 0.19, validFrom: '2007-01-01', validTo: null, source: 'EC TEDB', checkedOn: '2026-10-29' },
  { country: 'FR', province: null, rateType: 'standard', rate: 0.2, validFrom: '2014-01-01', validTo: null, source: 'EC TEDB', checkedOn: '2026-10-29' },
  { country: 'ES', province: null, rateType: 'standard', rate: 0.21, validFrom: '2012-09-01', validTo: null, source: 'EC TEDB', checkedOn: '2026-10-29' },
  { country: 'IT', province: null, rateType: 'standard', rate: 0.22, validFrom: '2013-10-01', validTo: null, source: 'EC TEDB', checkedOn: '2026-10-29' },
  { country: 'NL', province: null, rateType: 'standard', rate: 0.21, validFrom: '2012-10-01', validTo: null, source: 'EC TEDB', checkedOn: '2026-10-29' },
  // Canada GST/HST (CRA)
  { country: 'CA', province: null, rateType: 'gst', rate: 0.05, validFrom: '2008-01-01', validTo: null, source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'ON', rateType: 'hst', rate: 0.13, validFrom: '2010-07-01', validTo: null, source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'NB', rateType: 'hst', rate: 0.15, validFrom: '2016-07-01', validTo: null, source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'NL', rateType: 'hst', rate: 0.15, validFrom: '2016-07-01', validTo: null, source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'PE', rateType: 'hst', rate: 0.15, validFrom: '2016-10-01', validTo: null, source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'NS', rateType: 'hst', rate: 0.15, validFrom: '2010-07-01', validTo: '2025-03-31', source: 'CRA GST/HST rates', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'NS', rateType: 'hst', rate: 0.14, validFrom: '2025-04-01', validTo: null, source: 'CRA GST/HST rates (NS 14% from 1 Apr 2025)', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'BC', rateType: 'pst', rate: 0.07, validFrom: '2013-04-01', validTo: null, source: 'BC Ministry of Finance (confirm)', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'MB', rateType: 'pst', rate: 0.07, validFrom: '2013-07-01', validTo: null, source: 'Manitoba Finance (confirm)', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'SK', rateType: 'pst', rate: 0.06, validFrom: '2017-03-23', validTo: null, source: 'Saskatchewan Finance (confirm)', checkedOn: '2026-10-29' },
  { country: 'CA', province: 'QC', rateType: 'pst', rate: 0.09975, validFrom: '2013-01-01', validTo: null, source: 'Revenu Québec QST (confirm)', checkedOn: '2026-10-29' },
  // Australia
  {
    country: 'AU',
    province: null,
    rateType: 'gst',
    rate: 0.1,
    validFrom: '2000-07-01',
    validTo: null,
    source: 'ATO: How GST works',
    checkedOn: '2026-10-29',
  },
]

export function rateForOrder(args: {
  country: string
  province?: string | null
  orderDate: string
}): { rate: number; row: TaxRateRow | null; note: string } {
  const country = args.country.toUpperCase()
  if (country === 'US') {
    return {
      rate: 0,
      row: null,
      note: 'US sales tax is taken only from the export — no assumed rate (v16 §12.8 / v16.1 A3).',
    }
  }

  const candidates = TAX_RATES.filter((r) => {
    if (r.country !== country) return false
    if (r.province && args.province && r.province !== args.province.toUpperCase()) return false
    if (r.province && !args.province) return false
    if (args.orderDate < r.validFrom) return false
    if (r.validTo && args.orderDate > r.validTo) return false
    return true
  })

  // Prefer province-specific, then standard/hst/gst
  const row =
    candidates.find((r) => r.province) ||
    candidates.find((r) => r.rateType === 'hst' || r.rateType === 'standard' || r.rateType === 'gst') ||
    candidates[0] ||
    null

  if (!row) {
    return {
      rate: 0,
      row: null,
      note: `No built-in rate for ${country}${args.province ? '/' + args.province : ''} — use export tax or add TEDB row.`,
    }
  }

  return {
    rate: row.rate,
    row,
    note: `Used ${row.rateType} ${(row.rate * 100).toFixed(3)}% from ${row.source} (checked ${row.checkedOn}); valid from ${row.validFrom}. Estimates, not tax advice.`,
  }
}
