export type Plan = 'free' | 'pro'

export interface Product {
  id: string
  name: string
  unitsSold: number
  sellingPrice: number
  productCost: number
  shippingCost: number
  adSpend: number
  platformFeePct: number
  returnRatePct: number
}

export interface ProductMetrics {
  product: Product
  grossRevenue: number
  refunds: number
  netRevenue: number
  productCostTotal: number
  shippingTotal: number
  adSpend: number
  platformFees: number
  returnHandlingCost: number
  trueProfit: number
  marginPct: number
  costShare: {
    product: number
    shipping: number
    ads: number
    fees: number
    returns: number
  }
}

export interface HealthBreakdown {
  netMargin: { score: number; max: number; valuePct: number; label: string }
  adEfficiency: { score: number; max: number; valuePct: number; label: string }
  returns: { score: number; max: number; valuePct: number; label: string }
  platformFees: { score: number; max: number; valuePct: number; label: string }
  cogsRatio: { score: number; max: number; valuePct: number; label: string }
}

export type LeakArea =
  | 'ads'
  | 'returns'
  | 'platformFees'
  | 'productCost'
  | 'shipping'

export interface MarginLeak {
  id: string
  area: LeakArea
  title: string
  description: string
  monthlyImpactGbp: number
  severity: 'high' | 'medium' | 'low'
  recommendation: string
  productId?: string
  productName?: string
}

export interface PortfolioResult {
  products: ProductMetrics[]
  totals: {
    grossRevenue: number
    refunds: number
    netRevenue: number
    productCostTotal: number
    shippingTotal: number
    adSpend: number
    platformFees: number
    returnHandlingCost: number
    trueProfit: number
    marginPct: number
  }
  healthScore: number
  healthBreakdown: HealthBreakdown
  leaks: MarginLeak[]
  headlineRecommendation: string
}

export interface Scenario {
  id: string
  name: string
  products: Product[]
  /** Multipliers applied on top of product fields for quick what-ifs */
  adjustments: ScenarioAdjustments
}

export interface ScenarioAdjustments {
  pricePct: number
  adSpendPct: number
  returnRatePct: number
  productCostPct: number
}

export interface HistorySnapshot {
  id: string
  label: string
  createdAt: string
  trueProfit: number
  marginPct: number
  healthScore: number
  productCount: number
}

export interface AppPersistedState {
  version: 1
  plan: Plan
  theme: 'light' | 'dark'
  products: Product[]
  scenarios: Scenario[]
  activeScenarioId: string | null
  csvUploadCount: number
  history: HistorySnapshot[]
  upgradeOpen: boolean
}
