import type { AppPersistedState } from './types'

const KEY = 'marginos.v3'

export function loadState(): AppPersistedState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppPersistedState
    if (parsed?.version !== 3) return null
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
