/**
 * Free 24-hour retention helpers (v16.4 F1 / K11).
 * Run: npm test
 */
import {
  FREE_RETENTION_MS,
  applyPaymentFailure,
  earliestClock,
  formatDurationLeft,
  isExpired,
  msLeft,
  pauseClocks,
  resumeOrCancelClocks,
  startFreeClock,
  upsertClock,
} from './retention'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const t0 = Date.parse('2026-10-30T10:00:00.000Z')

const orders = startFreeClock('orders', t0)
assert(orders.kind === 'orders', 'kind')
assert(Date.parse(orders.expiresAt) - t0 === FREE_RETENTION_MS, '24h expiry')
assert(!isExpired(orders, t0 + FREE_RETENTION_MS - 1), 'still valid at 23h59')
assert(isExpired(orders, t0 + FREE_RETENTION_MS), 'expired at 24h')
assert(msLeft(orders, t0 + FREE_RETENTION_MS - 60_000) === 60_000, '1 min left')

const template = startFreeClock('template', t0 + 8 * 3600_000)
const clocks = [orders, template]
const early = earliestClock(clocks, t0)
assert(early?.kind === 'orders', 'earliest is orders')

const replaced = upsertClock(clocks, 'orders', t0 + 5 * 3600_000)
assert(replaced.filter((c) => c.kind === 'orders').length === 1, 'one orders clock')
assert(replaced.some((c) => c.kind === 'template'), 'template kept')

const paused = pauseClocks([orders], t0 + 12 * 3600_000)
assert(paused[0].pausedAt != null, 'paused')
assert(!isExpired(paused[0], t0 + FREE_RETENTION_MS + 3600_000), 'paused not expired')
const resumed = resumeOrCancelClocks(paused, { cancel: false, now: t0 + FREE_RETENTION_MS + 3600_000 })
assert(resumed[0].pausedAt == null, 'resumed')
assert(msLeft(resumed[0], t0 + FREE_RETENTION_MS + 3600_000) === 12 * 3600_000, 'remaining preserved')
const cancelled = resumeOrCancelClocks(paused, { cancel: true })
assert(cancelled.length === 0, 'upgrade cancels clocks')

assert(formatDurationLeft(90 * 60_000) === '1 h 30 min', 'format h+m')
assert(formatDurationLeft(45 * 60_000) === '45 min', 'format min')

// K11 / F8.14 — payment fail deletes clocks whose original expiresAt has passed
const pausedNearEnd = pauseClocks([orders], t0 + FREE_RETENTION_MS - 60_000)
const failPastDue = applyPaymentFailure(pausedNearEnd, t0 + FREE_RETENTION_MS + 60_000)
assert(failPastDue.expiredKinds.includes('orders'), 'past-due kind deleted on fail')
assert(failPastDue.keep.length === 0, 'no clocks kept when past due')

const pausedEarly = pauseClocks([orders], t0 + 60_000)
const failStillOpen = applyPaymentFailure(pausedEarly, t0 + 120_000)
assert(failStillOpen.expiredKinds.length === 0, 'still-open not deleted')
assert(failStillOpen.keep.length === 1 && failStillOpen.keep[0].pausedAt == null, 'resumed on fail')
assert(
  Math.abs(msLeft(failStillOpen.keep[0], t0 + 120_000) - (FREE_RETENTION_MS - 60_000)) < 2,
  'remaining preserved on fail resume',
)

console.log('retention.test.ts: all assertions passed')
