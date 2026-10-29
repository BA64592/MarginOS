export type Plan = 'free' | 'pro'
export type HomeCurrency = 'GBP' | 'EUR' | 'USD' | 'CAD' | 'AUD'
export type Platform = 'shopify' | 'amazon' | 'etsy' | 'manual'
export type Confidence = 'High' | 'Medium' | 'Low'
export type ScoreBand = 'Strong' | 'Needs attention' | 'At risk'
export type ProductVerdict = 'Losing money' | 'Thin' | 'Healthy' | 'No revenue'
export type LeakId =
  | 'unprofitable_ads'
  | 'high_returns'
  | 'loss_making_product'
  | 'shipping_subsidy'
  | 'fee_drag'
  | 'thin_pricing'

export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
  authProvider: 'email' | 'google'
  googleEmailVerified?: boolean
  createdAt: string
  lastSignInAt: string
  timeZone: string
  timeZoneChangedAt: string | null
}

export interface TaxSettings {
  pricesIncludeTax: boolean
  businessCountry: string
  vatGstRegistered: boolean
  vatGstFrom: string | null
  euOss: boolean
  euIoss: boolean
  ukFlatRate: boolean
  ukFlatRatePct: number
  usSelfCollectStates: string[]
}

export interface ProductCostRow {
  sku: string
  name: string
  unitCost: number
  packagingCost: number
  /** Per-SKU average shipping cost per unit (when no per-order shipping). */
  shippingCostPerUnit: number
  /** Per returned unit average return shipping / restocking. */
  returnCostPerReturnedUnit: number
  digital: boolean
}

export interface AdSpendEntry {
  id: string
  channel: string
  amount: number
  startDate: string
  endDate: string
  attributedRevenue?: number
}

export interface OrderLine {
  id: string
  orderId: string
  linePosition: number
  platform: Platform
  sku: string
  name: string
  quantity: number
  unitPrice: number
  /** Product revenue before order-level discounts (qty × unit price − line discounts). */
  lineValue: number
  orderDate: string
  postingDate: string
  currency: HomeCurrency | string
  country: string
  region: string | null
  requiresShipping: boolean
  isFba: boolean
  taxAmount: number
  marketplaceCollectedTax: boolean
  /** Allocated / line amounts in home currency after conversion. */
  shippingCharged: number
  shippingCost: number
  discount: number
  refundAmount: number
  returnExtraCost: number
  referralFee: number
  paymentFee: number
  listingFee: number
  fulfilmentFee: number
  conversionFee: number
  feesActual: {
    referral: boolean
    payment: boolean
    listing: boolean
  }
  shippingChargedAllocated: boolean
  shippingCostAllocated: boolean
  refundAllocated: boolean
  refundUnitsEstimated: boolean
}

export interface StorePeriod {
  start: string
  end: string
  days: number
}

export interface ProductResult {
  sku: string
  name: string
  platforms: Platform[]
  unitsSold: number
  revenue: number
  productPackagingCost: number
  shippingCost: number
  shippingCharged: number
  netShippingCost: number
  fees: number
  returnCost: number
  adSpendShare: number
  contributionMargin: number
  contributionMarginPct: number
  netProfit: number
  netMarginPct: number
  verdict: ProductVerdict
  unitReturnRate: number
  ordersCount: number
  returnCostRate: number
  refundUnitsEstimated: boolean
  costMissing: boolean
  targetPrice: number | null
  targetPriceNote: string
  maths: Record<string, string>
}

export interface HealthPartResult {
  key: 'netMargin' | 'adEfficiency' | 'returns' | 'productMix' | 'fees' | 'shipping'
  label: string
  weight: number
  score: number | null
  dropped: boolean
  dropReason?: string
  detail: string
}

export interface HealthResult {
  score: number | null
  band: ScoreBand | null
  confidence: Confidence
  confidenceReasons: string[]
  parts: HealthPartResult[]
  maths: string[]
}

export interface Leak {
  id: string
  leakType: LeakId
  title: string
  description: string
  monthlyImpact: number
  recommendation: string
  productSku?: string
  productName?: string
  estimated?: boolean
  maths: string[]
}

export interface StoreTotals {
  revenue: number
  productPackagingCost: number
  shippingCost: number
  shippingCharged: number
  netShippingCost: number
  shippingEligibleRevenue: number
  fees: number
  returnCost: number
  adSpend: number
  conversionFees: number
  overheads: number
  contributionMargin: number
  contributionMarginPct: number
  trueProfit: number
  netMarginPct: number
  blendedRoas: number | null
  breakEvenRoas: number | null | 'not reachable'
  breakEvenAcos: number | null
  orderCount: number
  period: StorePeriod
}

export interface AnalysisResult {
  totals: StoreTotals
  products: ProductResult[]
  health: HealthResult
  leaks: Leak[]
  headlineAction: string
  warnings: string[]
  shortPeriod: boolean
}

export interface ScenarioAdjustments {
  pricePct: number
  productCostPct: number
  adSpendPct: number
  returnRatePct: number
  shippingChargePct: number
  discountPct: number
}

export interface Scenario {
  id: string
  name: string
  adjustments: ScenarioAdjustments
}

export interface SavedDataset {
  id: string
  name: string
  start: string
  end: string
  platforms: Platform[]
  createdAt: string
}

export interface UploadDayState {
  dateKey: string
  used: number
}

export interface AppPersistedState {
  version: 2
  plan: Plan
  theme: 'light' | 'dark'
  currency: HomeCurrency
  user: AuthUser | null
  tax: TaxSettings
  targetMarginPct: number
  monthlyOverheads: number
  conversionFeePct: number
  userFxRates: Record<string, number>
  costs: ProductCostRow[]
  ads: AdSpendEntry[]
  lines: OrderLine[]
  scenarios: Scenario[]
  savedDatasets: SavedDataset[]
  uploadDay: UploadDayState
  earlyBirdSold: number
  licenceActive: boolean
  digitalListingSkus: string[]
}
