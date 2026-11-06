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
  personalDataStripWarning,
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

/** Normalise EN/DE/FR Amazon transaction type labels. */
function classifyAmazonType(raw: string): 'order' | 'refund' | 'transfer' | 'service_fee' | 'other' {
  const t = raw.toLowerCase().trim()
  if (!t) return 'other'
  if (t.includes('transfer') || t === 'überweisung' || t === 'ueberweisung' || t === 'virement') {
    return 'transfer'
  }
  if (
    t.includes('service fee') ||
    t.includes('servicegebühr') ||
    t.includes('servicegebuehr') ||
    t.includes('frais de service')
  ) {
    return 'service_fee'
  }
  if (
    t.includes('refund') ||
    t.includes('erstattung') ||
    t.includes('remboursement') ||
    t.includes('reembolso') ||
    t.includes('rimborso')
  ) {
    return 'refund'
  }
  if (
    t === 'order' ||
    t.includes('order') ||
    t === 'bestellung' ||
    t.includes('bestellung') ||
    t === 'commande' ||
    t.includes('commande') ||
    t === 'pedido' ||
    t === 'ordine'
  ) {
    return 'order'
  }
  return 'other'
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
  const pii = personalDataStripWarning(rows[headerRow])
  if (pii) warnings.push(pii)
  const lines: OrderLine[] = []

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]
    const typeRaw = cell(row, idx, 'type', 'Typ', 'transaction type', 'Type de transaction')
    const kind = classifyAmazonType(typeRaw)
    if (kind === 'other' && !typeRaw) continue
    if (kind === 'transfer') continue

    const date =
      parseDateLoose(cell(row, idx, 'date/time', 'Datum/Uhrzeit', 'date time', 'date/heure')) ||
      '1970-01-01'
    const orderId = cell(row, idx, 'order id', 'Bestellnummer', 'numéro de commande') || `AMZ-${r}`
    const sku = cell(row, idx, 'sku', 'SKU') || 'UNKNOWN'
    const name = cell(row, idx, 'description', 'Beschreibung', 'Description') || sku
    const qty = Math.abs(Math.round(parseAmount(cell(row, idx, 'quantity', 'Menge', 'Quantité')) ?? 0))
    const marketplace = cell(row, idx, 'marketplace')
    const country = marketplaceRegion(marketplace)
    const fulfillment = cell(row, idx, 'fulfillment', 'fulfilment').toLowerCase()
    const isFba = fulfillment.includes('amazon')

    const productSales =
      parseAmount(cell(row, idx, 'product sales', 'Umsätze', 'product sales', 'ventes de produits')) ?? 0
    const shippingCredits =
      parseAmount(
        cell(
          row,
          idx,
          'shipping credits',
          'postage credits',
          'Versandgutschriften',
          'crédits d’expédition',
        ),
      ) ?? 0
    const giftWrap = parseAmount(cell(row, idx, 'gift wrap credits', 'giftwrap credits')) ?? 0
    const promo = Math.abs(parseAmount(cell(row, idx, 'promotional rebates')) ?? 0)
    const sellingFees =
      Math.abs(parseAmount(cell(row, idx, 'selling fees', 'Verkaufsgebühren', 'frais de vente')) ?? 0)
    const fbaFees = Math.abs(parseAmount(cell(row, idx, 'fba fees')) ?? 0)
    const otherFees = Math.abs(parseAmount(cell(row, idx, 'other transaction fees')) ?? 0)
    const regulatory = Math.abs(parseAmount(cell(row, idx, 'Regulatory Fee')) ?? 0)
    const other = parseAmount(cell(row, idx, 'other')) ?? 0
    const taxCollection = cell(row, idx, 'tax collection model').toLowerCase()

    if (kind === 'service_fee') {
      const otherDesc = cell(row, idx, 'description', 'Beschreibung', 'Description').toLowerCase()
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

    if (kind === 'order' || kind === 'refund') {
      const isRefund = kind === 'refund'
      const units = Math.max(1, qty || 1)
      const salesAbs = Math.abs(productSales)
      const unitPrice = units > 0 ? salesAbs / units : 0
      // Refunds must not inflate revenue/units — return cost only (BUG-001).
      lines.push({
        id: createId('line'),
        orderId,
        linePosition: 1,
        platform: 'amazon',
        sku,
        name,
        quantity: isRefund ? units : units,
        unitPrice: roundMoney(unitPrice),
        lineValue: isRefund ? 0 : roundMoney(salesAbs + Math.abs(giftWrap)),
        orderDate: date,
        postingDate: date,
        currency: homeCurrency,
        country,
        region: cell(row, idx, 'order state') || null,
        requiresShipping: true,
        isFba,
        taxAmount: isRefund
          ? 0
          : Math.abs(parseAmount(cell(row, idx, 'product sales tax')) ?? 0),
        marketplaceCollectedTax:
          taxCollection.includes('marketplace') ||
          Boolean(cell(row, idx, 'marketplace withheld tax')),
        shippingCharged: isRefund ? 0 : roundMoney(Math.abs(shippingCredits)),
        shippingCost: 0,
        discount: isRefund ? 0 : roundMoney(promo),
        refundAmount: isRefund ? roundMoney(salesAbs + Math.abs(shippingCredits)) : 0,
        returnExtraCost: 0,
        referralFee: isRefund ? 0 : roundMoney(sellingFees + regulatory),
        paymentFee: 0,
        listingFee: 0,
        fulfilmentFee: isRefund ? 0 : roundMoney(fbaFees),
        conversionFee: 0,
        feesActual: {
          referral: !isRefund && (sellingFees > 0 || regulatory > 0),
          payment: true, // Amazon bundles processing into selling fees — treated as actual referral only
          listing: true, // no listing type compared; mark true so referral-only compare can proceed for Amazon
        },
        shippingChargedAllocated: false,
        shippingCostAllocated: false,
        refundAllocated: false,
        refundUnitsEstimated: isRefund,
      })
      if (!isRefund && otherFees > 0) {
        // counted as other marketplace fees — fold into referral for CM, not compared separately in draft
        const last = lines[lines.length - 1]
        last.referralFee = roundMoney(last.referralFee + otherFees)
      }
    }
  }

  if (!lines.length) {
    errors.push(
      'No Order/Refund rows parsed from Amazon report. Check the Type column (Order/Bestellung/Commande) and that dates are quoted.',
    )
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
