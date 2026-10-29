import type { AppPersistedState } from './types'

const KEY = 'marginos.v5'
const LEGACY_KEYS = ['marginos.v4', 'marginos.v3', 'marginos.v2', 'marginos.v1']

export function loadState(): AppPersistedState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      for (const k of LEGACY_KEYS) localStorage.removeItem(k)
      return null
    }
    const parsed = JSON.parse(raw) as AppPersistedState
    if (parsed?.version !== 5) return null
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
