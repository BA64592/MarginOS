import type { AccessKind, AppPersistedState, Plan } from './types'

const GLOBAL_KEY = 'marginos.v6'
const LEGACY_KEYS = ['marginos.v5', 'marginos.v4', 'marginos.v3', 'marginos.v2', 'marginos.v1']

function accountKey(accountId: string) {
  return `marginos.v6.acct.${accountId}`
}

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

function readKey(key: string): AppPersistedState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return migrate(parsed)
  } catch {
    return null
  }
}

/**
 * Load persisted state.
 * Prefer per-account bucket when accountId is known (BUG-022 multi-tenant isolation).
 * Falls back to legacy global key for anonymous / first migration.
 */
export function loadState(accountId?: string | null): AppPersistedState | null {
  try {
    if (accountId) {
      const scoped = readKey(accountKey(accountId))
      if (scoped) return scoped
      // One-time migrate: global blob belongs to this account
      const global = readKey(GLOBAL_KEY) || readKey('marginos.v5')
      if (global?.user?.id === accountId || (global && !global.user)) {
        if (global) {
          localStorage.setItem(accountKey(accountId), JSON.stringify({ ...global, version: 6 }))
        }
        return global
      }
      return null
    }

    const raw = localStorage.getItem(GLOBAL_KEY) || localStorage.getItem('marginos.v5')
    if (!raw) {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k)
      return null
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next = migrate(parsed)
    if (!next) return null
    if (localStorage.getItem(GLOBAL_KEY) == null && localStorage.getItem('marginos.v5')) {
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(next))
    }
    // If a user is embedded in the global blob, also mirror into their account key.
    if (next.user?.id) {
      localStorage.setItem(accountKey(next.user.id), JSON.stringify(next))
    }
    return next
  } catch {
    return null
  }
}

export function saveState(state: AppPersistedState) {
  try {
    const payload = JSON.stringify({ ...state, version: 6, theme: 'light' })
    const accountId = state.user?.id
    if (accountId) {
      localStorage.setItem(accountKey(accountId), payload)
      // Keep global pointer for boot before session hydrate (user id only — shop lives in account key).
      localStorage.setItem(
        GLOBAL_KEY,
        JSON.stringify({
          ...state,
          version: 6,
          theme: 'light',
          // Avoid leaving previous-account order lines on the anonymous key after sign-in.
          lines: [],
          costs: [],
          ads: [],
          savedDatasets: [],
          scenarios: state.scenarios,
        }),
      )
    } else {
      localStorage.setItem(GLOBAL_KEY, payload)
    }
  } catch {
    // ignore
  }
}

/** Wipe product local data (account deletion / factory reset of this browser). */
export function clearAllState(accountId?: string | null) {
  try {
    if (accountId) localStorage.removeItem(accountKey(accountId))
    localStorage.removeItem(GLOBAL_KEY)
    for (const k of LEGACY_KEYS) localStorage.removeItem(k)
    localStorage.removeItem('marginos.verifyTokens')
  } catch {
    // ignore
  }
}
