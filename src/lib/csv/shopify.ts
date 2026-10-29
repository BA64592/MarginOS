/**
 * Shopify Orders (+ optional Payments transactions) — v16.1 A1.
 * Columns found by header name (case/space insensitive). Confirm “confirm” fields against real exports (K1).
 */
import { createId } from '../format'
import { allocateByLineValue, roundMoney } from '../money'
import type { HomeCurrency, OrderLine } from '../types'
import {
  cell,
  headerIndex,
  parseAmount,
  parseCsv,
  parseDateLoose,
  requireColumns,
  STRIP_HEADER_HINTS,
} from './parseUtils'

export interface ShopifyImportResult {
  lines: OrderLine[]
  errors: string[]
  warnings: string[]
  summary: { newRows: number; skipped: number }
}

function isStripHeader(h: string) {
  const n = h.toLowerCase()
  return STRIP_HEADER_HINTS.some((s) => n.includes(s))
}

export function parseShopifyOrdersCsv(
  text: string,
  homeCurrency: HomeCurrency,
): ShopifyImportResult {
  const rows = parseCsv(text)
  const errors: string[] = []
  const warnings: string[] = []
  if (rows.length < 2) {
    return { lines: [], errors: ['Shopify Orders CSV needs a header and at least one row.'], warnings, summary: { newRows: 0, skipped: 0 } }
  }

  const headers = rows[0]
  const idx = headerIndex(headers)
  const requiredErr = requireColumns(idx, ['Id', 'Lineitem quantity', 'Lineitem price'])
  if (requiredErr) {
    return { lines: [], errors: [requiredErr], warnings, summary: { newRows: 0, skipped: 0 } }
  }

  // Warn if personal-data columns present (they are ignored)
  headers.forEach((h) => {
    if (isStripHeader(h)) {
      // stripped — do not store
    }
  })

  type AccOrder = {
    orderId: string
    name: string
    date: string
    currency: string
    shippingCharged: number
    discount: number
    refund: number
    country: string
    region: string | null
    financial: string
    canceled: boolean
    lines: {
      position: number
      sku: string
      name: string
      qty: number
      price: number
      lineDiscount: number
      requiresShipping: boolean
    }[]
  }

  const orders = new Map<string, AccOrder>()
  let skipped = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const orderId = cell(row, idx, 'Id') || cell(row, idx, 'Name')
    if (!orderId) {
      skipped++
      continue
    }
    const financial = cell(row, idx, 'Financial Status').toLowerCase()
    const canceledAt = cell(row, idx, 'Canceled at')
    const canceled = Boolean(canceledAt) && (financial === 'voided' || financial === 'refunded')

    let order = orders.get(orderId)
    if (!order) {
      order = {
        orderId,
        name: cell(row, idx, 'Name') || orderId,
        date: parseDateLoose(cell(row, idx, 'Created at')) || '1970-01-01',
        currency: cell(row, idx, 'Currency') || homeCurrency,
        shippingCharged: parseAmount(cell(row, idx, 'Shipping')) ?? 0,
        discount: parseAmount(cell(row, idx, 'Discount Amount')) ?? 0,
        refund: parseAmount(cell(row, idx, 'Refunded Amount')) ?? 0,
        country: cell(row, idx, 'Shipping Country', 'Billing Country') || 'GB',
        region: cell(row, idx, 'Shipping Province', 'Billing Province') || null,
        financial,
        canceled,
        lines: [],
      }
      orders.set(orderId, order)
    }

    // Order-level fields blank on later lines — only take when present
    const ship = parseAmount(cell(row, idx, 'Shipping'))
    if (ship != null && ship > 0) order.shippingCharged = ship
    const disc = parseAmount(cell(row, idx, 'Discount Amount'))
    if (disc != null && disc > 0) order.discount = disc
    const ref = parseAmount(cell(row, idx, 'Refunded Amount'))
    if (ref != null && ref > 0) order.refund = ref

    const qty = parseAmount(cell(row, idx, 'Lineitem quantity')) ?? 0
    const price = parseAmount(cell(row, idx, 'Lineitem price')) ?? 0
    if (qty <= 0) {
      skipped++
      continue
    }
    const tags = cell(row, idx, 'Tags').toLowerCase()
    if (tags.includes('test')) {
      warnings.push(`Order ${order.name}: tagged test — flagged, not dropped.`)
    }

    order.lines.push({
      position: order.lines.length + 1,
      sku: cell(row, idx, 'Lineitem sku', 'Lineitem SKU') || `NOSKU-${orderId}-${order.lines.length + 1}`,
      name: cell(row, idx, 'Lineitem name') || 'Line item',
      qty: Math.round(qty),
      price,
      lineDiscount: parseAmount(cell(row, idx, 'Lineitem discount')) ?? 0,
      requiresShipping: ['true', '1', 'yes'].includes(
        cell(row, idx, 'Lineitem requires shipping').toLowerCase(),
      ),
    })
  }

  const lines: OrderLine[] = []
  for (const order of orders.values()) {
    if (order.canceled) continue
    if (!order.lines.length) continue
    const lineValues = order.lines.map((l) => roundMoney(l.qty * l.price - l.lineDiscount))
    const shipAlloc = allocateByLineValue(order.shippingCharged, lineValues)
    const discAlloc = allocateByLineValue(order.discount, lineValues)
    const refundAlloc = allocateByLineValue(order.refund, lineValues)

    order.lines.forEach((l, i) => {
      const lineValue = lineValues[i]
      lines.push({
        id: createId('line'),
        orderId: order.orderId,
        linePosition: l.position,
        platform: 'shopify',
        sku: l.sku,
        name: l.name,
        quantity: l.qty,
        unitPrice: l.price,
        lineValue,
        orderDate: order.date,
        postingDate: order.date,
        currency: order.currency,
        country: order.country,
        region: order.region,
        requiresShipping: l.requiresShipping,
        isFba: false,
        taxAmount: 0,
        marketplaceCollectedTax: false,
        shippingCharged: shipAlloc[i] ?? 0,
        shippingCost: 0, // seller shipping from template
        discount: roundMoney((discAlloc[i] ?? 0) + l.lineDiscount),
        refundAmount: refundAlloc[i] ?? 0,
        returnExtraCost: 0,
        referralFee: 0,
        paymentFee: 0,
        listingFee: 0,
        fulfilmentFee: 0,
        conversionFee: 0,
        feesActual: { referral: false, payment: false, listing: false },
        shippingChargedAllocated: order.shippingCharged > 0,
        shippingCostAllocated: false,
        refundAllocated: order.refund > 0,
        refundUnitsEstimated: order.refund > 0,
      })
    })
  }

  return {
    lines,
    errors,
    warnings,
    summary: { newRows: lines.length, skipped },
  }
}

/** Optional Shopify Payments transactions — actual payment fees. Join by Order Name. */
export function applyShopifyPaymentFees(
  lines: OrderLine[],
  paymentsCsv: string,
): { lines: OrderLine[]; warnings: string[]; mathsNote: string } {
  const rows = parseCsv(paymentsCsv)
  const warnings: string[] = []
  if (rows.length < 2) {
    return {
      lines,
      warnings: ['Shopify Payments export empty — payment fees remain estimated.'],
      mathsNote: '',
    }
  }
  const idx = headerIndex(rows[0])
  const feesByOrder = new Map<string, number>()
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const type = cell(row, idx, 'Type').toLowerCase()
    if (!['charge', 'refund', 'dispute'].includes(type)) continue
    const order = cell(row, idx, 'Order')
    const fee = parseAmount(cell(row, idx, 'Fee')) ?? 0
    if (!order) continue
    feesByOrder.set(order, (feesByOrder.get(order) ?? 0) + fee)
  }

  const mathsNote =
    'Shopify Payments Fee may include international and conversion charges; recorded wholly as payment processing (v16.1 A1).'

  const next = lines.map((l) => ({ ...l }))
  const byOrder = new Map<string, OrderLine[]>()
  for (const l of next) {
    const list = byOrder.get(l.orderId) ?? []
    list.push(l)
    byOrder.set(l.orderId, list)
  }

  // Also try matching by display name stored nowhere — sample uses orderId; fees keyed by Order Name.
  // Map fee totals onto lines of matching orderId when Name equals Order column; callers should pass Name as orderId when known.
  for (const [orderKey, feeTotal] of feesByOrder) {
    const group =
      byOrder.get(orderKey) ||
      [...byOrder.values()].find((g) => g[0]?.orderId === orderKey)
    if (!group?.length) continue
    const values = group.map((g) => g.lineValue)
    const alloc = allocateByLineValue(feeTotal, values)
    group.forEach((g, i) => {
      g.paymentFee = alloc[i] ?? 0
      g.feesActual = { ...g.feesActual, payment: true }
    })
  }

  if (!feesByOrder.size) warnings.push('No charge/refund/dispute fee rows found in Payments export.')
  return { lines: next, warnings, mathsNote }
}
