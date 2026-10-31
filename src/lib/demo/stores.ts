/**
 * Marketing soft-launch demo stores (synthetic data only).
 * Store A Shopify — healthy with hidden loss-maker
 * Store B Amazon — struggling, several leaks
 * Store C Etsy — mixed “looks profitable but isn’t”
 */
import { createId } from '../format'
import { roundMoney } from '../money'
import type { AdSpendEntry, HomeCurrency, OrderLine, ProductCostRow } from '../types'

export type DemoStoreId = 'store_a_shopify' | 'store_b_amazon' | 'store_c_etsy' | 'store_multi'

export type DemoStoreMeta = {
  id: DemoStoreId
  label: string
  platformNote: string
  story: string
}

export const DEMO_STORES: DemoStoreMeta[] = [
  {
    id: 'store_a_shopify',
    label: 'Store A · Shopify',
    platformNote: 'Shopify only',
    story: 'Healthy overall Health Score — one product quietly loses money after fees & shipping.',
  },
  {
    id: 'store_b_amazon',
    label: 'Store B · Amazon',
    platformNote: 'Amazon FBA',
    story: 'Struggling shop: low Health Score, ads, returns and fee drag with clear fixes.',
  },
  {
    id: 'store_c_etsy',
    label: 'Store C · Etsy',
    platformNote: 'Etsy',
    story: 'Middle of the road — winners next to listings that look profitable but aren’t.',
  },
  {
    id: 'store_multi',
    label: 'Multi-platform demo',
    platformNote: 'Shopify + Amazon + Etsy',
    story: 'One Pro shop combining all three launch platforms (for multi-platform recording).',
  },
]

type LineSeed = {
  platform: OrderLine['platform']
  sku: string
  name: string
  qty: number
  unitPrice: number
  n: number
  shippingCharged?: number
  shippingCost?: number
  referralPct?: number
  paymentFee?: number
  listingFee?: number
  fulfilmentFee?: number
  refundEvery?: number
  isFba?: boolean
  country?: string
}

function expandLines(seeds: LineSeed[], currency: HomeCurrency): OrderLine[] {
  const lines: OrderLine[] = []
  let n = 0
  for (const s of seeds) {
    for (let i = 0; i < s.n; i++) {
      const lineValue = roundMoney(s.unitPrice * s.qty)
      const refund = s.refundEvery && i % s.refundEvery === 0 ? lineValue : 0
      lines.push({
        id: createId('demo'),
        orderId: `${s.platform[0].toUpperCase()}-${s.sku}-${++n}`,
        linePosition: 1,
        platform: s.platform,
        sku: s.sku,
        name: s.name,
        quantity: s.qty,
        unitPrice: s.unitPrice,
        lineValue,
        orderDate: '2026-09-15',
        postingDate: '2026-09-15',
        currency,
        country: s.country ?? 'GB',
        region: null,
        requiresShipping: true,
        isFba: Boolean(s.isFba),
        taxAmount: 0,
        marketplaceCollectedTax: Boolean(s.isFba),
        shippingCharged: s.shippingCharged ?? 0,
        shippingCost: s.shippingCost ?? 0,
        discount: 0,
        refundAmount: refund,
        returnExtraCost: 0,
        referralFee: roundMoney(lineValue * (s.referralPct ?? 0)),
        paymentFee: s.paymentFee ?? 0,
        listingFee: s.listingFee ?? 0,
        fulfilmentFee: s.fulfilmentFee ?? 0,
        conversionFee: 0,
        feesActual: {
          referral: (s.referralPct ?? 0) > 0,
          payment: (s.paymentFee ?? 0) > 0 || Boolean(s.isFba),
          listing: (s.listingFee ?? 0) > 0 || Boolean(s.isFba),
        },
        shippingChargedAllocated: (s.shippingCharged ?? 0) > 0,
        shippingCostAllocated: false,
        refundAllocated: refund > 0,
        refundUnitsEstimated: refund > 0,
        isSample: true,
      })
    }
  }
  return lines
}

function markCosts(rows: Omit<ProductCostRow, 'isSample'>[]): ProductCostRow[] {
  return rows.map((c) => ({ ...c, isSample: true }))
}

function ads(amount: number, channel: string): AdSpendEntry[] {
  return [
    {
      id: createId('ad'),
      channel,
      amount,
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      isSample: true,
    },
  ]
}

/** Store A — Shopify healthy, hidden loss on GIFT-BOX after fees + undercharged shipping. */
export function buildStoreA(currency: HomeCurrency = 'GBP') {
  const costs = markCosts([
    {
      sku: 'SOAP-SET',
      name: 'Botanical Soap Trio',
      unitCost: 4.5,
      packagingCost: 0.8,
      shippingCostPerUnit: 2.2,
      returnCostPerReturnedUnit: 1.5,
      digital: false,
    },
    {
      sku: 'CANDLE-LG',
      name: 'Large Soy Candle',
      unitCost: 6,
      packagingCost: 1.2,
      shippingCostPerUnit: 3.5,
      returnCostPerReturnedUnit: 2,
      digital: false,
    },
    {
      sku: 'GIFT-BOX',
      name: 'Seasonal Gift Box',
      unitCost: 22,
      packagingCost: 4,
      shippingCostPerUnit: 8,
      returnCostPerReturnedUnit: 4,
      digital: false,
    },
    {
      sku: 'TOTE',
      name: 'Organic Cotton Tote',
      unitCost: 3.2,
      packagingCost: 0.4,
      shippingCostPerUnit: 1.8,
      returnCostPerReturnedUnit: 1,
      digital: false,
    },
  ])
  const lines = expandLines(
    [
      {
        platform: 'shopify',
        sku: 'SOAP-SET',
        name: 'Botanical Soap Trio',
        qty: 1,
        unitPrice: 18,
        n: 90,
        shippingCharged: 2.95,
        shippingCost: 2.2,
        referralPct: 0,
        paymentFee: 0.35,
      },
      {
        platform: 'shopify',
        sku: 'CANDLE-LG',
        name: 'Large Soy Candle',
        qty: 1,
        unitPrice: 28,
        n: 70,
        shippingCharged: 3.95,
        shippingCost: 3.5,
        paymentFee: 0.45,
      },
      {
        platform: 'shopify',
        sku: 'TOTE',
        name: 'Organic Cotton Tote',
        qty: 1,
        unitPrice: 14,
        n: 55,
        shippingCharged: 1.95,
        shippingCost: 1.8,
        paymentFee: 0.28,
      },
      // Looks premium at £32 — loses money once packaging, shipping cost and card fees land
      {
        platform: 'shopify',
        sku: 'GIFT-BOX',
        name: 'Seasonal Gift Box',
        qty: 1,
        unitPrice: 32,
        n: 40,
        shippingCharged: 2.95,
        shippingCost: 8,
        paymentFee: 0.55,
        refundEvery: 10,
      },
    ],
    currency,
  )
  return { costs, lines, ads: ads(380, 'Meta'), label: 'Store A · Shopify' }
}

/** Store B — Amazon struggling: high ads, returns, fee drag, loss-makers. */
export function buildStoreB(currency: HomeCurrency = 'GBP') {
  const costs = markCosts([
    {
      sku: 'PHONE-CASE',
      name: 'Clear Phone Case',
      unitCost: 2.1,
      packagingCost: 0.3,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 1.2,
      digital: false,
    },
    {
      sku: 'CABLE-USB',
      name: 'USB-C Cable 2m',
      unitCost: 1.8,
      packagingCost: 0.2,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 0.8,
      digital: false,
    },
    {
      sku: 'STAND-ALU',
      name: 'Aluminium Laptop Stand',
      unitCost: 22,
      packagingCost: 2,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 5,
      digital: false,
    },
    {
      sku: 'GADGET-KIT',
      name: 'Desk Gadget Kit',
      unitCost: 14,
      packagingCost: 1.5,
      shippingCostPerUnit: 0,
      returnCostPerReturnedUnit: 4,
      digital: false,
    },
  ])
  const lines = expandLines(
    [
      {
        platform: 'amazon',
        sku: 'PHONE-CASE',
        name: 'Clear Phone Case',
        qty: 1,
        unitPrice: 9.99,
        n: 120,
        isFba: true,
        referralPct: 0.15,
        fulfilmentFee: 2.8,
        refundEvery: 6,
      },
      {
        platform: 'amazon',
        sku: 'CABLE-USB',
        name: 'USB-C Cable 2m',
        qty: 1,
        unitPrice: 7.99,
        n: 100,
        isFba: true,
        referralPct: 0.15,
        fulfilmentFee: 2.4,
        refundEvery: 5,
      },
      {
        platform: 'amazon',
        sku: 'STAND-ALU',
        name: 'Aluminium Laptop Stand',
        qty: 1,
        unitPrice: 39.99,
        n: 35,
        isFba: true,
        referralPct: 0.15,
        fulfilmentFee: 5.2,
        refundEvery: 4,
      },
      {
        platform: 'amazon',
        sku: 'GADGET-KIT',
        name: 'Desk Gadget Kit',
        qty: 1,
        unitPrice: 24.99,
        n: 50,
        isFba: true,
        referralPct: 0.15,
        fulfilmentFee: 4.1,
        refundEvery: 5,
      },
    ],
    currency,
  )
  return { costs, lines, ads: ads(1850, 'Sponsored Products'), label: 'Store B · Amazon' }
}

/** Store C — Etsy mixed: winners + “looks profitable” losers. */
export function buildStoreC(currency: HomeCurrency = 'GBP') {
  const costs = markCosts([
    {
      sku: 'PRINT-A3',
      name: 'Art Print A3',
      unitCost: 2.5,
      packagingCost: 1.2,
      shippingCostPerUnit: 2.8,
      returnCostPerReturnedUnit: 1.5,
      digital: false,
    },
    {
      sku: 'JEWEL-RING',
      name: 'Handmade Brass Ring',
      unitCost: 6,
      packagingCost: 0.8,
      shippingCostPerUnit: 1.5,
      returnCostPerReturnedUnit: 2,
      digital: false,
    },
    {
      sku: 'MUG-CUSTOM',
      name: 'Custom Name Mug',
      unitCost: 7.5,
      packagingCost: 2,
      shippingCostPerUnit: 5.5,
      returnCostPerReturnedUnit: 3,
      digital: false,
    },
    {
      sku: 'BUNDLE-CRAFT',
      name: 'Craft Starter Bundle',
      unitCost: 14,
      packagingCost: 3,
      shippingCostPerUnit: 5.5,
      returnCostPerReturnedUnit: 4,
      digital: false,
    },
  ])
  const lines = expandLines(
    [
      {
        platform: 'etsy',
        sku: 'PRINT-A3',
        name: 'Art Print A3',
        qty: 1,
        unitPrice: 22,
        n: 55,
        shippingCharged: 3.5,
        shippingCost: 2.8,
        referralPct: 0.066,
        listingFee: 0.2,
        paymentFee: 0.4,
      },
      {
        platform: 'etsy',
        sku: 'JEWEL-RING',
        name: 'Handmade Brass Ring',
        qty: 1,
        unitPrice: 28,
        n: 48,
        shippingCharged: 2.5,
        shippingCost: 1.5,
        referralPct: 0.066,
        listingFee: 0.2,
        paymentFee: 0.45,
      },
      // £18 feels fine — shipping + fees eat the margin
      {
        platform: 'etsy',
        sku: 'MUG-CUSTOM',
        name: 'Custom Name Mug',
        qty: 1,
        unitPrice: 18,
        n: 55,
        shippingCharged: 2.5,
        shippingCost: 5.5,
        referralPct: 0.066,
        listingFee: 0.2,
        paymentFee: 0.35,
        refundEvery: 8,
      },
      {
        platform: 'etsy',
        sku: 'BUNDLE-CRAFT',
        name: 'Craft Starter Bundle',
        qty: 1,
        unitPrice: 34,
        n: 32,
        shippingCharged: 3.5,
        shippingCost: 5.5,
        referralPct: 0.066,
        listingFee: 0.2,
        paymentFee: 0.55,
      },
    ],
    currency,
  )
  // Higher ads + mug loss keep Health Score mid-band (“Needs attention”), not Strong.
  return { costs, lines, ads: ads(2100, 'Etsy Ads'), label: 'Store C · Etsy' }
}

/** Combined multi-platform shop for Pro recording. */
export function buildStoreMulti(currency: HomeCurrency = 'GBP') {
  const a = buildStoreA(currency)
  const b = buildStoreB(currency)
  const c = buildStoreC(currency)
  // Take a slice of each so the shop is readable
  const lines = [
    ...a.lines.filter((_, i) => i % 3 === 0),
    ...b.lines.filter((_, i) => i % 4 === 0),
    ...c.lines.filter((_, i) => i % 3 === 0),
  ].map((l) => ({ ...l, id: createId('demo') }))
  const costMap = new Map<string, ProductCostRow>()
  for (const row of [...a.costs, ...b.costs, ...c.costs]) costMap.set(row.sku, row)
  return {
    costs: [...costMap.values()],
    lines,
    ads: ads(980, 'Blended'),
    label: 'Multi-platform demo',
  }
}

export function buildDemoStore(id: DemoStoreId, currency: HomeCurrency = 'GBP') {
  switch (id) {
    case 'store_a_shopify':
      return buildStoreA(currency)
    case 'store_b_amazon':
      return buildStoreB(currency)
    case 'store_c_etsy':
      return buildStoreC(currency)
    case 'store_multi':
      return buildStoreMulti(currency)
  }
}
