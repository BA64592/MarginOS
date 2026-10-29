import { createId } from './calc'
import type { Product } from './types'

const REQUIRED = [
  'name',
  'units_sold',
  'selling_price',
  'product_cost',
  'shipping_cost',
  'ad_spend',
  'platform_fee_pct',
  'return_rate_pct',
] as const

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function toNumber(value: string, fallback = 0) {
  const cleaned = value.replace(/£|,/g, '').trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : fallback
}

export function parseProductsCsv(text: string): { products: Product[]; error?: string } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return { products: [], error: 'CSV needs a header row and at least one product.' }
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  const missing = REQUIRED.filter((h) => !headers.includes(h))
  if (missing.length) {
    return {
      products: [],
      error: `Missing columns: ${missing.join(', ')}. Expected: ${REQUIRED.join(', ')}.`,
    }
  }

  const index = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<string, number>
  const products: Product[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const name = cells[index.name]?.trim()
    if (!name) continue
    products.push({
      id: createId('prod'),
      name,
      unitsSold: Math.max(0, Math.round(toNumber(cells[index.units_sold]))),
      sellingPrice: Math.max(0, toNumber(cells[index.selling_price])),
      productCost: Math.max(0, toNumber(cells[index.product_cost])),
      shippingCost: Math.max(0, toNumber(cells[index.shipping_cost])),
      adSpend: Math.max(0, toNumber(cells[index.ad_spend])),
      platformFeePct: Math.max(0, toNumber(cells[index.platform_fee_pct])),
      returnRatePct: Math.max(0, toNumber(cells[index.return_rate_pct])),
    })
  }

  if (!products.length) {
    return { products: [], error: 'No valid product rows found in CSV.' }
  }

  return { products }
}

export function productsToCsv(products: Product[]) {
  const header = REQUIRED.join(',')
  const rows = products.map((p) =>
    [
      `"${p.name.replace(/"/g, '""')}"`,
      p.unitsSold,
      p.sellingPrice,
      p.productCost,
      p.shippingCost,
      p.adSpend,
      p.platformFeePct,
      p.returnRatePct,
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

export const SAMPLE_CSV = `name,units_sold,selling_price,product_cost,shipping_cost,ad_spend,platform_fee_pct,return_rate_pct
Merino Crew Tee,420,48,14.5,3.2,1850,12,6.5
Trail Runner Pack,180,129,52,6.8,2400,15,4.2
Ceramic Pour-Over,310,36,11,4.1,980,8,9.5
Wool Travel Scarf,95,58,19,2.8,640,10,3.1`
