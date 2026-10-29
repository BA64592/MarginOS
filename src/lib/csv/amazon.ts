/**
 * Amazon Custom Unified Transaction report — v16.1 A1.
 * Header may not be row 1; find by "date/time" / "settlement id" (or DE/FR variants).
 * Amazon has one compared fee type: referral/commission (selling fees).
 */
import { createId } from '../format'
import { roundMoney } from '../money'
import type { AdSpendEntry, HomeCurrency, OrderLine } from '../types'
import {
  cell,
  headerIndex,
  normalizeHeader,
  parseAmount,
  parseCsv,
  parseDateLoose,
} from './parseUtils'

const HEADER_MARKERS = [
  'date/time',
  'datum/uhrzeit',
  'settlement id',
  'abrechnungsnummer',
]

export interface AmazonImportResult {
  lines: OrderLine[]
  ads: AdSpendEntry[]
  overheadHints: number
  errors: string[]
  warnings: string[]
  summary: { newRows: number }
}

function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const joined = rows[i].map(normalizeHeader).join('|')
    if (HEADER_MARKERS.some((m) => joined.includes(m))) return i
  }
  return -1
}

function marketplaceRegion(marketplace: string): string {
  const m = marketplace.toLowerCase()
  if (m.includes('.co.uk') || m.includes('amazon.uk')) return 'GB'
  if (m.includes('.com') && !m.includes('.com.')) return 'US'
  if (m.includes('.ca')) return 'CA'
  if (m.includes('.com.au') || m.includes('.au')) return 'AU'
  if (m.includes('.de')) return 'DE'
  if (m.includes('.fr')) return 'FR'
  if (m.includes('.it')) return 'IT'
  if (m.includes('.es')) return 'ES'
  return 'GB'
}

export function parseAmazonTransactionCsv(
  text: string,
  homeCurrency: HomeCurrency,
): AmazonImportResult {
  const rows = parseCsv(text)
  const errors: string[] = []
  const warnings: string[] = []
  const ads: AdSpendEntry[] = []
  let overheadHints = 0

  const headerRow = findHeaderRow(rows)
  if (headerRow < 0) {
    return {
      lines: [],
      ads,
      overheadHints: 0,
      errors: [
        'Could not find Amazon Transaction header (expected date/time + settlement id, or localised equivalents).',
      ],
      warnings,
      summary: { newRows: 0 },
    }
  }

  const idx = headerIndex(rows[headerRow])
  const lines: OrderLine[] = []

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    const type = cell(row, idx, 'type', 'Typ', 'transaction type').toLowerCase()
    if (!type) continue
    if (type === 'transfer' || type.includes('transfer')) continue

    const date =
      parseDateLoose(cell(row, idx, 'date/time', 'Datum/Uhrzeit', 'date time')) || '1970-01-01'
    const orderId = cell(row, idx, 'order id', 'Bestellnummer') || `AMZ-${r}`
    const sku = cell(row, idx, 'sku', 'SKU') || 'UNKNOWN'
    const name = cell(row, idx, 'description', 'Beschreibung') || sku
    const qty = Math.abs(Math.round(parseAmount(cell(row, idx, 'quantity', 'Menge')) ?? 0))
    const marketplace = cell(row, idx, 'marketplace')
    const country = marketplaceRegion(marketplace)
    const fulfillment = cell(row, idx, 'fulfillment', 'fulfilment').toLowerCase()
    const isFba = fulfillment.includes('amazon')

    const productSales = parseAmount(cell(row, idx, 'product sales', 'Umsätze', 'product sales')) ?? 0
    const shippingCredits =
      parseAmount(
        cell(row, idx, 'shipping credits', 'postage credits', 'Versandgutschriften'),
      ) ?? 0
    const giftWrap = parseAmount(cell(row, idx, 'gift wrap credits', 'giftwrap credits')) ?? 0
    const promo = Math.abs(parseAmount(cell(row, idx, 'promotional rebates')) ?? 0)
    const sellingFees = Math.abs(parseAmount(cell(row, idx, 'selling fees', 'Verkaufsgebühren')) ?? 0)
    const fbaFees = Math.abs(parseAmount(cell(row, idx, 'fba fees')) ?? 0)
    const otherFees = Math.abs(parseAmount(cell(row, idx, 'other transaction fees')) ?? 0)
    const regulatory = Math.abs(parseAmount(cell(row, idx, 'Regulatory Fee')) ?? 0)
    const other = parseAmount(cell(row, idx, 'other')) ?? 0
    const taxCollection = cell(row, idx, 'tax collection model').toLowerCase()

    if (type.includes('service fee') || type === 'service fee') {
      const otherDesc = cell(row, idx, 'description', 'Beschreibung').toLowerCase()
      if (otherDesc.includes('advertising') || otherDesc.includes('cost of advertising')) {
        ads.push({
          id: createId('ad'),
          channel: 'Amazon Sponsored',
          amount: Math.abs(other),
          startDate: date,
          endDate: date,
        })
      } else if (otherDesc.includes('subscription')) {
        overheadHints += Math.abs(other)
      }
      continue
    }

    if (type.includes('order') || type === 'order' || type.includes('refund')) {
      const isRefund = type.includes('refund')
      const units = Math.max(1, qty || 1)
      const sales = isRefund ? -Math.abs(productSales) : productSales
      const unitPrice = units > 0 ? Math.abs(sales) / units : 0
      lines.push({
        id: createId('line'),
        orderId,
        linePosition: 1,
        platform: 'amazon',
        sku,
        name,
        quantity: units,
        unitPrice: roundMoney(unitPrice),
        lineValue: roundMoney(Math.abs(sales) + Math.abs(giftWrap)),
        orderDate: date,
        postingDate: date,
        currency: homeCurrency,
        country,
        region: cell(row, idx, 'order state') || null,
        requiresShipping: true,
        isFba,
        taxAmount: Math.abs(parseAmount(cell(row, idx, 'product sales tax')) ?? 0),
        marketplaceCollectedTax: taxCollection.includes('marketplace') || Boolean(cell(row, idx, 'marketplace withheld tax')),
        shippingCharged: roundMoney(Math.abs(shippingCredits)),
        shippingCost: 0,
        discount: roundMoney(promo),
        refundAmount: isRefund ? roundMoney(Math.abs(sales) + Math.abs(shippingCredits)) : 0,
        returnExtraCost: 0,
        referralFee: roundMoney(sellingFees + regulatory),
        paymentFee: 0,
        listingFee: 0,
        fulfilmentFee: roundMoney(fbaFees),
        conversionFee: 0,
        feesActual: {
          referral: sellingFees > 0 || regulatory > 0,
          payment: true, // Amazon bundles processing into selling fees — treated as actual referral only
          listing: true, // no listing type compared; mark true so referral-only compare can proceed for Amazon
        },
        shippingChargedAllocated: false,
        shippingCostAllocated: false,
        refundAllocated: false,
        refundUnitsEstimated: isRefund,
      })
      if (otherFees > 0) {
        // counted as other marketplace fees — fold into referral for CM, not compared separately in draft
        const last = lines[lines.length - 1]
        last.referralFee = roundMoney(last.referralFee + otherFees)
      }
    }
  }

  if (!lines.length) {
    warnings.push('No Order/Refund rows parsed from Amazon report.')
  }

  return {
    lines,
    ads,
    overheadHints,
    errors,
    warnings,
    summary: { newRows: lines.length },
  }
}
