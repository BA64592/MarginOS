/** 24-month inactivity rule for kept / Pro order data (v16.4 K8 / F9). */
export const INACTIVITY_MS = 24 * 30 * 24 * 60 * 60 * 1000 // 24 × 30-day months
export const INACTIVITY_WARN_60_MS = 60 * 24 * 60 * 60 * 1000
export const INACTIVITY_WARN_30_MS = 30 * 24 * 60 * 60 * 1000

export function msSince(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return 0
  return Math.max(0, now - t)
}

export function isInactive24Months(lastActivityIso: string | null | undefined, now = Date.now()): boolean {
  if (!lastActivityIso) return false
  return msSince(lastActivityIso, now) >= INACTIVITY_MS
}

export function inactivityWarningDays(
  lastActivityIso: string | null | undefined,
  now = Date.now(),
): 60 | 30 | null {
  if (!lastActivityIso) return null
  const left = INACTIVITY_MS - msSince(lastActivityIso, now)
  if (left <= 0) return null
  if (left <= INACTIVITY_WARN_30_MS) return 30
  if (left <= INACTIVITY_WARN_60_MS) return 60
  return null
}
