/**
 * v18.1 subscription tiers (K41–K52, FINAL 6 Nov 2026).
 * Non-GBP fixed amounts undecided (OD6) — GBP checkout only by default.
 */
import { formatMoney } from './format'
import type { Platform } from './types'

/** Paid subscription tiers (no permanent Free plan). */
export type PlanId = 'starter' | 'growth' | 'pro' | 'scale'

/**
 * Access state on the account.
 * - none: signed out / no trial / no sub — sample shop only
 * - trial | active: selected PlanId applies (trial features use trialEntitlement — K52)
 * - legacy: pre-v18 lifetime Pro licence → Pro-level features
 * - canceled_access: still within disclosed access window before wipe (K39/K51)
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
  /** @deprecated K42 — founding offer removed; kept for legacy persisted state only. */
  foundingMonthlyGbp: number
  orderLimit: number
  shops: number
  maxPlatforms: number
  historyMonths: number | null
  seats: number
  uploadsTelemetryDefault: number | null
  savedDatasetsTelemetryDefault: number | null
}

/** K42 — founding offer removed. Cap kept at 0 so no account receives a founding price. */
export const FOUNDING_CAP = 0
export const TRIAL_DAYS = 14
/** @deprecated K42 */
export const FOUNDING_MONTHLY_ONLY = true
/** Recommended trial reminder lead days (configurable). */
export const TRIAL_REMINDER_DAYS = 3

/** K43 — exact sticky banner string (approved word-for-word). */
export const TRIAL_BANNER_LINE = '14 days free. Cancel before day 14 and pay nothing. From £39/mo'

/** K46 — single primary CTA label everywhere. */
export const PRIMARY_TRIAL_CTA = 'Start 14-day free trial'

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyGbp: 39,
    annualGbp: 390,
    foundingMonthlyGbp: 39,
    orderLimit: 500,
    shops: 1,
    maxPlatforms: 1,
    historyMonths: 3,
    seats: 1,
    uploadsTelemetryDefault: 10,
    savedDatasetsTelemetryDefault: 3,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    mostPopular: true,
    monthlyGbp: 79,
    annualGbp: 790,
    foundingMonthlyGbp: 79,
    orderLimit: 2000,
    shops: 1,
    maxPlatforms: 2,
    historyMonths: 12,
    seats: 1,
    uploadsTelemetryDefault: 30,
    savedDatasetsTelemetryDefault: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyGbp: 129,
    annualGbp: 1290,
    foundingMonthlyGbp: 129,
    orderLimit: 5000,
    shops: 1,
    maxPlatforms: 4,
    historyMonths: 24,
    seats: 2,
    uploadsTelemetryDefault: null,
    savedDatasetsTelemetryDefault: null,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthlyGbp: 199,
    annualGbp: 1990,
    foundingMonthlyGbp: 199,
    orderLimit: 15000,
    shops: 3,
    maxPlatforms: 4,
    historyMonths: null,
    seats: 5,
    uploadsTelemetryDefault: null,
    savedDatasetsTelemetryDefault: null,
  },
}

export const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'scale']

const TIER_FEATURES: Record<PlanId, Set<PlanFeature>> = {
  starter: new Set(['diagnosis', 'simpleUkTax', 'tiktokBeta']),
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

/**
 * K52 reverse trial: Starter/Growth/Pro trials receive Pro features + 5,000-order limit.
 * Scale trials receive Scale.
 */
export function trialEntitlementFor(chosen: PlanId): PlanId {
  return chosen === 'scale' ? 'scale' : 'pro'
}

/** Plan used for entitlements while access is trial (K52). */
export function entitlementPlanId(
  access: AccessKind,
  chosen: PlanId | 'none' | 'legacy' | null | undefined,
  trialEntitlement?: PlanId | null,
): PlanId | null {
  const chosenId = effectivePlanId(chosen)
  if (access === 'trial') {
    if (trialEntitlement) return trialEntitlement
    if (chosenId) return trialEntitlementFor(chosenId)
    return 'pro'
  }
  return chosenId
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

export function planPriceLabel(plan: PlanId, interval: BillingInterval, _founding = false) {
  const def = PLANS[plan]
  if (interval === 'year') return formatGbp(def.annualGbp)
  return formatGbp(def.monthlyGbp)
}

export function trialCheckoutSummary(plan: PlanId, interval: BillingInterval, _founding = false) {
  const def = PLANS[plan]
  const price = interval === 'year' ? def.annualGbp : def.monthlyGbp
  const entitlement = trialEntitlementFor(plan)
  return {
    trialDays: TRIAL_DAYS,
    postTrialPrice: formatGbp(price),
    interval,
    planName: def.name,
    entitlementName: PLANS[entitlement].name,
    reverseTrial: plan !== 'pro' && plan !== 'scale',
  }
}

/** Charge date hint for checkout / pricing cards (account TZ ≈ local). */
export function trialChargeDateLabel(from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + TRIAL_DAYS)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** All launch platforms including TikTok Shop UK Beta. */
export const LAUNCH_PLATFORMS: Platform[] = ['shopify', 'amazon', 'etsy', 'tiktok']

export function nextPlanAfter(plan: PlanId): PlanId | null {
  const i = PLAN_ORDER.indexOf(plan)
  if (i < 0 || i >= PLAN_ORDER.length - 1) return null
  return PLAN_ORDER[i + 1]
}

/** K47 — shop / seat explanations (tap-friendly). */
export const SHOP_HELP =
  'A shop is one online store connected to this account. If you sell from two Shopify stores, that is two shops. Starter, Growth and Pro include 1 shop. Scale includes up to 3.'
export const SEAT_HELP =
  'A seat is a person who can sign in to this account. The owner always uses one seat. Extra seats are for people such as a bookkeeper or business partner. Starter and Growth include 1 seat (the owner). Pro includes 2. Scale includes 5.'
