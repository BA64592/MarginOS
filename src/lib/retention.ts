import { createId } from './format'
import type { FreeRetentionClock, FreeUploadKind } from './types'

export const FREE_RETENTION_MS = 24 * 60 * 60 * 1000

export function startFreeClock(kind: FreeUploadKind, now = Date.now()): FreeRetentionClock {
  return {
    id: createId('clk'),
    kind,
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + FREE_RETENTION_MS).toISOString(),
    pausedAt: null,
    remainingMsWhenPaused: null,
  }
}

/** Effective expiry accounting for a delayed-payment pause (K11). */
export function effectiveExpiresAt(clock: FreeRetentionClock, now = Date.now()): number {
  if (clock.pausedAt != null && clock.remainingMsWhenPaused != null) {
    return now + clock.remainingMsWhenPaused
  }
  return new Date(clock.expiresAt).getTime()
}

export function msLeft(clock: FreeRetentionClock, now = Date.now()): number {
  return Math.max(0, effectiveExpiresAt(clock, now) - now)
}

export function isExpired(clock: FreeRetentionClock, now = Date.now()): boolean {
  if (clock.pausedAt != null) return false
  return msLeft(clock, now) <= 0
}

export function earliestClock(clocks: FreeRetentionClock[], now = Date.now()): FreeRetentionClock | null {
  if (!clocks.length) return null
  return [...clocks].sort((a, b) => effectiveExpiresAt(a, now) - effectiveExpiresAt(b, now))[0]
}

export function formatDurationLeft(ms: number): string {
  if (ms <= 0) return '0 min'
  const totalMin = Math.ceil(ms / 60000)
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function formatDeletionTime(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toUTCString()
  }
}

export function pauseClocks(clocks: FreeRetentionClock[], now = Date.now()): FreeRetentionClock[] {
  return clocks.map((c) => {
    if (c.pausedAt) return c
    return {
      ...c,
      pausedAt: new Date(now).toISOString(),
      remainingMsWhenPaused: msLeft(c, now),
    }
  })
}

export function resumeOrCancelClocks(
  clocks: FreeRetentionClock[],
  opts: { cancel: boolean; now?: number },
): FreeRetentionClock[] {
  const now = opts.now ?? Date.now()
  if (opts.cancel) return []
  return clocks.map((c) => {
    if (c.pausedAt == null || c.remainingMsWhenPaused == null) return c
    return {
      ...c,
      pausedAt: null,
      remainingMsWhenPaused: null,
      expiresAt: new Date(now + c.remainingMsWhenPaused).toISOString(),
    }
  })
}

/** Replace any clock of the same kind; keep others. */
export function upsertClock(
  clocks: FreeRetentionClock[],
  kind: FreeUploadKind,
  now = Date.now(),
): FreeRetentionClock[] {
  return [...clocks.filter((c) => c.kind !== kind), startFreeClock(kind, now)]
}

/**
 * Delayed payment failed (v16.4 F8.14 / K11).
 * Deletes clocks whose original expiresAt has already passed; resumes the rest.
 */
export function applyPaymentFailure(
  clocks: FreeRetentionClock[],
  now = Date.now(),
): { keep: FreeRetentionClock[]; expiredKinds: FreeUploadKind[] } {
  const expiredKinds: FreeUploadKind[] = []
  const keep: FreeRetentionClock[] = []
  for (const c of clocks) {
    if (new Date(c.expiresAt).getTime() <= now) {
      expiredKinds.push(c.kind)
      continue
    }
    if (c.pausedAt != null && c.remainingMsWhenPaused != null) {
      keep.push({
        ...c,
        pausedAt: null,
        remainingMsWhenPaused: null,
        expiresAt: new Date(now + c.remainingMsWhenPaused).toISOString(),
      })
    } else {
      keep.push(c)
    }
  }
  return { keep, expiredKinds }
}
