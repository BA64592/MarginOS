import { createId } from '../format'
import type { AdSpendEntry, HomeCurrency, ProductCostRow } from '../types'

const COST_HEADERS = ['sku', 'unit_cost', 'packaging_cost', 'shipping_cost_per_unit', 'return_cost_per_returned_unit', 'name', 'digital'] as const

function parseLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"'
        i++
      } else q = !q
      continue
    }
    if (ch === ',' && !q) {
      cells.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  cells.push(cur.trim())
  return cells
}

function num(v: string) {
  const n = Number(v.replace(/[£$€,]/g, '').trim())
  return Number.isFinite(n) ? n : NaN
}

export function parseCostTemplate(text: string, currency: HomeCurrency): {
  costs: ProductCostRow[]
  ads: AdSpendEntry[]
  errors: string[]
  currency: HomeCurrency
} {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const errors: string[] = []
  const costs: ProductCostRow[] = []
  const ads: AdSpendEntry[] = []
  if (lines.length < 2) {
    return { costs, ads, errors: ['Template needs a header and at least one row.'], currency }
  }

  // Optional first meta line: currency,GBP
  let start = 0
  let fileCurrency = currency
  if (lines[0].toLowerCase().startsWith('currency,')) {
    const c = lines[0].split(',')[1]?.trim().toUpperCase()
    if (['GBP', 'EUR', 'USD', 'CAD', 'AUD'].includes(c)) fileCurrency = c as HomeCurrency
    else errors.push(`Row 1: currency must be one of GBP, EUR, USD, CAD, AUD`)
    start = 1
  }

  const header = parseLine(lines[start]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  const isAds = header.includes('channel') && header.includes('amount')
  const idx = Object.fromEntries(header.map((h, i) => [h, i]))

  for (let i = start + 1; i < lines.length; i++) {
    const rowNum = i + 1
    const cells = parseLine(lines[i])
    if (isAds) {
      const channel = cells[idx.channel]
      const amount = num(cells[idx.amount])
      const startDate = cells[idx.start_date]
      const endDate = cells[idx.end_date]
      if (!channel || !Number.isFinite(amount) || amount < 0) {
        errors.push(`Row ${rowNum}: invalid ad spend row`)
        continue
      }
      if (startDate && endDate && endDate < startDate) {
        errors.push(`Row ${rowNum}: end date before start date`)
        continue
      }
      ads.push({
        id: createId('ad'),
        channel,
        amount: Math.round(amount * 100) / 100,
        startDate: startDate || '2026-09-01',
        endDate: endDate || '2026-09-30',
        attributedRevenue: idx.attributed_revenue != null ? num(cells[idx.attributed_revenue]) || undefined : undefined,
      })
      continue
    }

    const sku = cells[idx.sku]
    const unitCost = num(cells[idx.unit_cost])
    const packaging = num(cells[idx.packaging_cost] ?? '0')
    const ship = num(cells[idx.shipping_cost_per_unit] ?? '0')
    const ret = num(cells[idx.return_cost_per_returned_unit] ?? '0')
    if (!sku) {
      errors.push(`Row ${rowNum}: missing sku`)
      continue
    }
    if (![unitCost, packaging, ship, ret].every((n) => Number.isFinite(n) && n >= 0)) {
      errors.push(`Row ${rowNum}: costs must be numbers ≥ 0 with up to 2 decimals`)
      continue
    }
    costs.push({
      sku,
      name: cells[idx.name] || sku,
      unitCost: Math.round(unitCost * 100) / 100,
      packagingCost: Math.round(packaging * 100) / 100,
      shippingCostPerUnit: Math.round(ship * 100) / 100,
      returnCostPerReturnedUnit: Math.round(ret * 100) / 100,
      digital: String(cells[idx.digital] || '').toLowerCase() === 'true',
    })
  }

  return { costs, ads, errors, currency: fileCurrency }
}

export const SAMPLE_COST_TEMPLATE = `currency,GBP
sku,name,unit_cost,packaging_cost,shipping_cost_per_unit,return_cost_per_returned_unit,digital
MERINO-TEE,Merino Crew Tee,11,1,0,2,false
TRAIL-PACK,Trail Runner Pack,42,2,0,4,false
POUR-OVER,Ceramic Pour-Over,9,1,0,2.5,false
SCARF,Wool Travel Scarf,16,1,0,1.5,false`

export const SAMPLE_ADS_TEMPLATE = `channel,amount,start_date,end_date,attributed_revenue
Meta,2200,2026-09-01,2026-09-30,6200
Google,1500,2026-09-01,2026-09-30,4100
TikTok,500,2026-09-01,2026-09-30,900`

export { COST_HEADERS }
