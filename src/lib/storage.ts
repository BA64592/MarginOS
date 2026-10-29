import type { AppPersistedState } from './types'

const KEY = 'marginos.v4'
const LEGACY_KEYS = ['marginos.v3', 'marginos.v2', 'marginos.v1']

export function loadState(): AppPersistedState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      // Drop stale empty demos from older keys so sample test data loads fresh.
      for (const k of LEGACY_KEYS) localStorage.removeItem(k)
      return null
    }
    const parsed = JSON.parse(raw) as AppPersistedState
    if (parsed?.version !== 4) return null
    return parsed
  } catch {
    return null
  }
}

export function saveState(state: AppPersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}
