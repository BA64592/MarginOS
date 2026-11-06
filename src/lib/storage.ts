import type { AccessKind, AppPersistedState, Plan } from './types'

const KEY = 'marginos.v6'
const LEGACY_KEYS = ['marginos.v5', 'marginos.v4', 'marginos.v3', 'marginos.v2', 'marginos.v1']

function migratePlan(raw: string | undefined): { plan: Plan; access: AccessKind } {
  // v5 lifetime Pro → legacy entitlement (Q28)
  if (raw === 'pro') return { plan: 'legacy', access: 'legacy' }
  if (raw === 'starter' || raw === 'growth' || raw === 'scale' || raw === 'legacy') {
    return { plan: raw, access: raw === 'legacy' ? 'legacy' : 'active' }
  }
  // free / none / missing → no subscription
  return { plan: 'none', access: 'none' }
}

function migrate(raw: Record<string, unknown>): AppPersistedState | null {
  const version = raw.version
  if (version !== 5 && version !== 6) return null

  const migrated = migratePlan(typeof raw.plan === 'string' ? raw.plan : undefined)
  const plan = (raw.plan as Plan) || migrated.plan
  const access =
    (raw.access as AccessKind) ||
    (plan === 'legacy' ? 'legacy' : plan === 'none' ? 'none' : migrated.access)

  return {
    ...(raw as unknown as AppPersistedState),
    version: 6,
    plan: plan,
    access,
    billingInterval: (raw.billingInterval as AppPersistedState['billingInterval']) ?? null,
    trialEndsAt: (raw.trialEndsAt as string | null) ?? null,
    accessEndsAt: (raw.accessEndsAt as string | null) ?? null,
    trialEntitlement: (raw.trialEntitlement as AppPersistedState['trialEntitlement']) ?? null,
    foundingEligible: Boolean(raw.foundingEligible ?? true),
    foundingSold: Number(raw.foundingSold ?? 0),
    theme: 'light',
    usageMonthKey: String(raw.usageMonthKey ?? ''),
    usageUniqueOrderIds: Array.isArray(raw.usageUniqueOrderIds)
      ? (raw.usageUniqueOrderIds as string[])
      : [],
    trialUsed: Boolean(raw.trialUsed ?? false),
    licenceActive: Boolean(
      raw.licenceActive ??
        (access === 'active' || access === 'trial' || access === 'legacy' || access === 'canceled_access'),
    ),
  }
}

export function loadState(): AppPersistedState | null {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('marginos.v5')
    if (!raw) {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k)
      return null
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next = migrate(parsed)
    if (!next) return null
    if (localStorage.getItem(KEY) == null && localStorage.getItem('marginos.v5')) {
      localStorage.setItem(KEY, JSON.stringify(next))
    }
    return next
  } catch {
    return null
  }
}

export function saveState(state: AppPersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: 6, theme: 'light' }))
  } catch {
    // ignore
  }
}

/** Wipe product local data (account deletion / factory reset of this browser). */
export function clearAllState() {
  try {
    localStorage.removeItem(KEY)
    for (const k of LEGACY_KEYS) localStorage.removeItem(k)
    localStorage.removeItem('marginos.verifyTokens')
  } catch {
    // ignore
  }
}
