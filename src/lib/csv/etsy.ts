/**
 * Etsy Orders + Order Items (+ optional Monthly Statement) — v16.1 A1.
 * Digital stays manual (K2 / v16.2): physical unless the user marks the listing or shop as digital.
 */
import { createId } from '../format'
import { allocateByLineValue, roundMoney } from '../money'
import type { AdSpendEntry, HomeCurrency, OrderLine } from '../types'
import {
  cell,
  headerIndex,
  parseAmount,
  parseCsv,
  parseDateLoose,
  requireColumns,
} from './parseUtils'

export interface EtsyImportResult {
  lines: OrderLine[]
  ads: AdSpendEntry[]
  errors: string[]
  warnings: string[]
  summary: { newRows: number }
}

export function parseEtsyOrdersAndItems(args: {
  ordersCsv: string
  itemsCsv: string
  statementCsv?: string
  homeCurrency: HomeCurrency
  digitalListingIds?: Set<string>
}): EtsyImportResult {
  const errors: string[] = []
  const warnings: string[] = []
  const ads: AdSpendEntry[] = []

  const orderRows = parseCsv(args.ordersCsv)
  const itemRows = parseCsv(args.itemsCsv)
  if (orderRows.length < 2) {
    return { lines: [], ads, errors: ['Etsy Orders CSV is required and missing.'], warnings, summary: { newRows: 0 } }
  }
  if (itemRows.length < 2) {
    return {
      lines: [],
      ads,
      errors: ['Etsy Order Items CSV is required and missing.'],
      warnings,
      summary: { newRows: 0 },
    }
  }

  const oIdx = headerIndex(orderRows[0])
  const iIdx = headerIndex(itemRows[0])
  const oReq = requireColumns(oIdx, ['Order ID'])
  const iReq = requireColumns(iIdx, ['Order ID', 'Transaction ID'])
  if (oReq) errors.push(oReq)
  if (iReq) errors.push(iReq)
  if (errors.length) {
    return { lines: [], ads, errors, warnings, summary: { newRows: 0 } }
  }

  type OrderMeta = {
    date: string
    currency: string
    shipping: number
    discount: number
    tax: number
    cardFee: number
    refund: number
    country: string
    region: string | null
  }
  const orders = new Map<string, OrderMeta>()

  for (let r = 1; r < orderRows.length; r++) {
    const row = orderRows[r]
    const id = cell(row, oIdx, 'Order ID')
    if (!id) continue
    const orderTotal = parseAmount(cell(row, oIdx, 'Order Total')) ?? 0
    const adjustedTotal = parseAmount(cell(row, oIdx, 'Adjusted Order Total'))
    const refund =
      adjustedTotal != null ? Math.max(0, orderTotal - adjustedTotal) : 0
    const cardFee =
      parseAmount(cell(row, oIdx, 'Adjusted Card Processing Fees')) ??
      parseAmount(cell(row, oIdx, 'Card Processing Fees')) ??
      0
    orders.set(id, {
      date: parseDateLoose(cell(row, oIdx, 'Sale Date')) || '1970-01-01',
      currency: cell(row, oIdx, 'Currency') || args.homeCurrency,
      shipping: parseAmount(cell(row, oIdx, 'Shipping')) ?? 0,
      discount:
        (parseAmount(cell(row, oIdx, 'Discount Amount')) ?? 0) +
        (parseAmount(cell(row, oIdx, 'Shipping Discount')) ?? 0),
      tax: parseAmount(cell(row, oIdx, 'Sales Tax')) ?? 0,
      cardFee,
      refund,
      country: cell(row, oIdx, 'Ship Country') || 'GB',
      region: cell(row, oIdx, 'Ship State') || null,
    })
  }

  // Group items by order
  const itemsByOrder = new Map<
    string,
    {
      transactionId: string
      listingId: string
      sku: string
      name: string
      qty: number
      price: number
      lineDiscount: number
    }[]
  >()

  for (let r = 1; r < itemRows.length; r++) {
    const row = itemRows[r]
    const orderId = cell(row, iIdx, 'Order ID')
    if (!orderId) continue
    const listingId = cell(row, iIdx, 'Listing ID')
    const list = itemsByOrder.get(orderId) ?? []
    list.push({
      transactionId: cell(row, iIdx, 'Transaction ID') || `${orderId}-${list.length}`,
      listingId,
      sku: cell(row, iIdx, 'SKU') || listingId || `ETSY-${orderId}-${list.length}`,
      name: cell(row, iIdx, 'Item Name') || 'Etsy item',
      qty: Math.round(parseAmount(cell(row, iIdx, 'Quantity')) ?? 1),
      price: parseAmount(cell(row, iIdx, 'Price')) ?? 0,
      lineDiscount: parseAmount(cell(row, iIdx, 'Discount Amount')) ?? 0,
    })
    itemsByOrder.set(orderId, list)
  }

  const lines: OrderLine[] = []
  for (const [orderId, items] of itemsByOrder) {
    const meta = orders.get(orderId)
    if (!meta) {
      warnings.push(`Order ${orderId} in Items but not Orders — skipped.`)
      continue
    }
    const values = items.map((it) => roundMoney(it.qty * it.price - it.lineDiscount))
    const shipAlloc = allocateByLineValue(meta.shipping, values)
    const discAlloc = allocateByLineValue(meta.discount, values)
    const refundAlloc = allocateByLineValue(meta.refund, values)
    const feeAlloc = allocateByLineValue(meta.cardFee, values)

    items.forEach((it, i) => {
      const digital = args.digitalListingIds?.has(it.listingId) ?? false
      lines.push({
        id: createId('line'),
        orderId,
        linePosition: i + 1,
        platform: 'etsy',
        sku: it.sku,
        name: it.name,
        quantity: it.qty,
        unitPrice: it.price,
        lineValue: values[i],
        orderDate: meta.date,
        postingDate: meta.date,
        currency: meta.currency,
        country: meta.country,
        region: meta.region,
        requiresShipping: !digital,
        isFba: false,
        taxAmount: 0,
        marketplaceCollectedTax: false,
        shippingCharged: shipAlloc[i] ?? 0,
        shippingCost: 0,
        discount: roundMoney((discAlloc[i] ?? 0) + it.lineDiscount),
        refundAmount: refundAlloc[i] ?? 0,
        returnExtraCost: 0,
        referralFee: 0,
        paymentFee: feeAlloc[i] ?? 0,
        listingFee: 0,
        fulfilmentFee: 0,
        conversionFee: 0,
        feesActual: {
          referral: false,
          payment: meta.cardFee > 0,
          listing: false,
        },
        shippingChargedAllocated: meta.shipping > 0,
        shippingCostAllocated: false,
        refundAllocated: meta.refund > 0,
        refundUnitsEstimated: meta.refund > 0,
      })
    })
  }

  if (!args.statementCsv) {
    warnings.push(
      'Etsy Monthly Statement not uploaded — listing/transaction fees labelled estimated; statement would add actual fees and postage labels.',
    )
  } else {
    applyEtsyStatement(args.statementCsv, lines, ads, warnings)
  }

  return { lines, ads, errors, warnings, summary: { newRows: lines.length } }
}

function applyEtsyStatement(
  csv: string,
  lines: OrderLine[],
  ads: AdSpendEntry[],
  warnings: string[],
) {
  const rows = parseCsv(csv)
  if (rows.length < 2) return
  const idx = headerIndex(rows[0])
  if (idx.date == null && idx['datum'] == null) {
    warnings.push('Etsy statement language/headers not recognised — skipped.')
    return
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const type = cell(row, idx, 'Type', 'Art').toLowerCase()
    const title = cell(row, idx, 'Title', 'Titel')
    const info = cell(row, idx, 'Info')
    const amount = Math.abs(parseAmount(cell(row, idx, 'Fees & Taxes', 'Amount')) ?? 0)
    const titleL = title.toLowerCase()

    if (type.includes('marketing') || titleL.includes('etsy ads') || titleL.includes('offsite ads')) {
      ads.push({
        id: createId('ad'),
        channel: titleL.includes('offsite') ? 'Etsy Offsite Ads' : 'Etsy Ads',
        amount,
        startDate: parseDateLoose(cell(row, idx, 'Date', 'Datum')) || '2026-01-01',
        endDate: parseDateLoose(cell(row, idx, 'Date', 'Datum')) || '2026-01-01',
      })
      continue
    }

    if (titleL.includes('postage') || titleL.includes('shipping label')) {
      const orderMatch = info.match(/Order\s*#?\s*(\w[\w-]*)/i)
      if (orderMatch) {
        const group = lines.filter((l) => l.orderId === orderMatch[1])
        if (group.length) {
          const alloc = allocateByLineValue(
            amount,
            group.map((g) => g.lineValue),
          )
          group.forEach((g, i) => {
            g.shippingCost = roundMoney(g.shippingCost + (alloc[i] ?? 0))
          })
        }
      }
      continue
    }

    if (titleL.includes('currency conversion')) {
      // Pro conversion fee — store-level; attach evenly for demo
      continue
    }

    if (titleL.includes('transaction fee') || titleL.includes('regulatory operating')) {
      const orderMatch = info.match(/Order\s*#?\s*(\w[\w-]*)/i)
      if (orderMatch) {
        const group = lines.filter((l) => l.orderId === orderMatch[1])
        if (group.length) {
          const alloc = allocateByLineValue(
            amount,
            group.map((g) => g.lineValue),
          )
          group.forEach((g, i) => {
            g.referralFee = roundMoney(g.referralFee + (alloc[i] ?? 0))
            g.feesActual = { ...g.feesActual, referral: true }
          })
        }
      }
      continue
    }

    if (titleL.includes('listing fee') || titleL.includes('renew sold')) {
      // Store-level listing fees — mark listing actual when we can attribute; else leave estimated
      continue
    }

    if (titleL.includes('processing fee')) {
      // Prefer Orders CSV card processing; statement as backup
      continue
    }
  }
}
