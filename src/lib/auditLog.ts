import type { DataActionEvent } from './types'

const KEY = 'marginos.audit.v1'
const MAX_EVENTS = 200

export function readAuditLog(): DataActionEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DataActionEvent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Log one confirmed data action. Never store email, names, SKUs, file names or amounts. */
export function logDataAction(event: Omit<DataActionEvent, 'id'>): DataActionEvent {
  const full: DataActionEvent = {
    ...event,
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  }
  try {
    const prev = readAuditLog()
    const next = [full, ...prev].slice(0, MAX_EVENTS)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore quota / private mode
  }
  return full
}
