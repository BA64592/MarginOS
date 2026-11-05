/**
 * v18 subscription tiers, GBP pricing, entitlements and order limits (FINAL 5 Nov 2026).
 * Non-GBP fixed amounts undecided (OD6) — GBP checkout only by default.
 */
import { formatMoney } from './format'
import type { Platform } from './types'

/** Paid subscription tiers (no permanent Free plan). */
export type PlanId = 'starter' | 'growth' | 'pro' | 'scale'

/**
 * Access state on the account.
 * - none: signed out / no trial / no sub — sample shop only
 * - trial | active: selected PlanId applies
 * - legacy: pre-v18 lifetime Pro licence → Pro-level features (Q28)
 * - canceled_access: still within disclosed access window before wipe
 */
export type AccessKind = 'none' | 'trial' | 'active' | 'legacy' | 'canceled_access'

export type BillingInterval = 'month' | 'year'

export type PlanFeature =
  | 'diagnosis'
  | 'overheads'
  | 'perChannelRoas'
  | 'ownFx'
  | 'fullTax'
  | 'simpleUkTax'
  | 'scenarios'
  | 'pdf'
  | 'multiPlatform'
  | 'tiktokBeta'

export interface PlanDefinition {
  id: PlanId
  name: string
  mostPopular?: boolean
  monthlyGbp: number
  annualGbp: number
  /** Founding 25% off monthly for first 12 months (first 100 paying). */
  foundingMonthlyGbp: number
  orderLimit: number
  shops: number
  maxPlatforms: number
  historyMonths: number | null
  seats: number
  uploadsTelemetryDefault: number | null
  savedDatasetsTelemetryDefault: number | null
  supportTarget: string
}

export const FOUNDING_CAP = 100
export const TRIAL_DAYS = 14
/** Recommended default — configurable (Q26): founding on monthly only. */
export const FOUNDING_MONTHLY_ONLY = true
/** Recommended trial reminder lead days (configurable). */
export const TRIAL_REMINDER_DAYS = 3

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyGbp: 39,
    annualGbp: 390,
    foundingMonthlyGbp: 29.25,
    orderLimit: 500,
    shops: 1,
    maxPlatforms: 1,
    historyMonths: 3,
    seats: 1,
    uploadsTelemetryDefault: 10,
    savedDatasetsTelemetryDefault: 3,
    supportTarget: '2 working days',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    mostPopular: true,
    monthlyGbp: 79,
    annualGbp: 790,
    foundingMonthlyGbp: 59.25,
    orderLimit: 2000,
    shops: 1,
    maxPlatforms: 2,
    historyMonths: 12,
    seats: 1,
    uploadsTelemetryDefault: 30,
    savedDatasetsTelemetryDefault: null,
    supportTarget: '1 working day',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyGbp: 129,
    annualGbp: 1290,
    foundingMonthlyGbp: 96.75,
    orderLimit: 5000,
    shops: 1,
    maxPlatforms: 4,
    historyMonths: 24,
    seats: 2,
    uploadsTelemetryDefault: null,
    savedDatasetsTelemetryDefault: null,
    supportTarget: 'Priority',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthlyGbp: 199,
    annualGbp: 1990,
    foundingMonthlyGbp: 149.25,
    orderLimit: 15000,
    shops: 3,
    maxPlatforms: 4,
    historyMonths: null,
    seats: 5,
    uploadsTelemetryDefault: null,
    savedDatasetsTelemetryDefault: null,
    supportTarget: 'Priority + onboarding',
  },
}

export const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'scale']

const TIER_FEATURES: Record<PlanId, Set<PlanFeature>> = {
  starter: new Set([
    'diagnosis',
    'simpleUkTax',
    'tiktokBeta',
  ]),
  growth: new Set([
    'diagnosis',
    'overheads',
    'perChannelRoas',
    'ownFx',
    'fullTax',
    'scenarios',
    'pdf',
    'multiPlatform',
    'tiktokBeta',
  ]),
  pro: new Set([
    'diagnosis',
    'overheads',
    'perChannelRoas',
    'ownFx',
    'fullTax',
    'scenarios',
    'pdf',
    'multiPlatform',
    'tiktokBeta',
  ]),
  scale: new Set([
    'diagnosis',
    'overheads',
    'perChannelRoas',
    'ownFx',
    'fullTax',
    'scenarios',
    'pdf',
    'multiPlatform',
    'tiktokBeta',
  ]),
}

/** Effective tier for feature checks (legacy lifetime → Pro). */
export function effectivePlanId(plan: PlanId | 'none' | 'legacy' | null | undefined): PlanId | null {
  if (!plan || plan === 'none') return null
  if (plan === 'legacy') return 'pro'
  return plan
}

export function hasPaidAccess(access: AccessKind): boolean {
  return access === 'trial' || access === 'active' || access === 'legacy' || access === 'canceled_access'
}

export function hasFeature(
  plan: PlanId | 'none' | 'legacy' | null | undefined,
  feature: PlanFeature,
): boolean {
  const id = effectivePlanId(plan)
  if (!id) return false
  return TIER_FEATURES[id].has(feature)
}

export function orderLimitFor(plan: PlanId | 'none' | 'legacy' | null | undefined): number | null {
  const id = effectivePlanId(plan)
  if (!id) return null
  return PLANS[id].orderLimit
}

export function maxPlatformsFor(plan: PlanId | 'none' | 'legacy' | null | undefined): number {
  const id = effectivePlanId(plan)
  if (!id) return 0
  return PLANS[id].maxPlatforms
}

export function scenarioSaveLimit(plan: PlanId | 'none' | 'legacy' | null | undefined): number | null {
  const id = effectivePlanId(plan)
  if (!id) return 0
  if (id === 'starter') return 0
  if (id === 'growth') return 2
  return null // unlimited
}

export function formatGbp(amount: number) {
  return formatMoney(amount, 'GBP', true)
}

export function planPriceLabel(plan: PlanId, interval: BillingInterval, founding = false) {
  const def = PLANS[plan]
  if (interval === 'year') return formatGbp(def.annualGbp)
  return formatGbp(founding ? def.foundingMonthlyGbp : def.monthlyGbp)
}

export function trialCheckoutSummary(plan: PlanId, interval: BillingInterval, founding: boolean) {
  const def = PLANS[plan]
  const price =
    interval === 'year' ? def.annualGbp : founding ? def.foundingMonthlyGbp : def.monthlyGbp
  return {
    trialDays: TRIAL_DAYS,
    postTrialPrice: formatGbp(price),
    interval,
    planName: def.name,
  }
}

/** All launch platforms including TikTok Shop UK Beta. */
export const LAUNCH_PLATFORMS: Platform[] = ['shopify', 'amazon', 'etsy', 'tiktok']

export function nextPlanAfter(plan: PlanId): PlanId | null {
  const i = PLAN_ORDER.indexOf(plan)
  if (i < 0 || i >= PLAN_ORDER.length - 1) return null
  return PLAN_ORDER[i + 1]
}
