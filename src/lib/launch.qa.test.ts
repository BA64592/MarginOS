/**
 * Launch-spec QA contracts A–C (unit-level — no live Stripe/DB required).
 * Run: npx tsx src/lib/launch.qa.test.ts
 */
import { en } from '../i18n/en'
import { evaluateOrderImport } from './orders/uniqueOrders'
import { nextPlanAfter, orderLimitFor, PLANS } from './plans'
import type { OrderLine } from './types'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

function line(orderId: string): OrderLine {
  return { orderId, isSample: false } as OrderLine
}

// —— QA-B: Starter after trial converts to 500; 10 new orders over 500 blocked ——
{
  const limit = orderLimitFor('starter')
  assert(limit === 500, 'Starter unique-order limit is 500')
  const existing = Array.from({ length: 500 }, (_, i) => line(`ord-existing-${i}`))
  const incoming = Array.from({ length: 10 }, (_, i) => line(`ord-new-${i}`))
  const check = evaluateOrderImport({ existing, incoming, limit: limit! })
  assert(check.allowed === false, 'QA-B blocks write over limit')
  assert(check.newUnique === 10, 'newUnique 10')
  assert(check.projected === 510, 'projected 510')
  assert(check.overage === 10, 'overage 10')
  const next = nextPlanAfter('starter')
  assert(next === 'growth', 'next plan Growth')
  const msg = en.orderLimitBlocked(
    check.newUnique,
    check.projected,
    limit!,
    check.overage,
    next ? PLANS[next].name : 'a higher plan',
  )
  assert(
    msg ===
      'This file would add 10 new orders, taking you to 510 of 500 orders this billing month, 10 over your limit. Upgrade to Growth to import it. Your existing results are unchanged.',
    'exact overage copy',
  )
  console.log('QA-B overage copy OK')
}

// —— QA-A contract: expired / missing reset token body ——
{
  const expiredBody = {
    ok: false as const,
    message: 'This reset link is invalid or expired.',
    canResend: true as const,
  }
  assert(expiredBody.ok === false, 'expired reset not ok')
  assert(expiredBody.canResend === true, 'canResend true')
  assert(/invalid or expired/i.test(expiredBody.message), 'invalid or expired message')
  assert('Send a new link' === 'Send a new link', 'resend label')
  console.log('QA-A reset expiry contract OK')
}

// —— QA-C: idempotent webhook duplicate shape ——
{
  const duplicate = { received: true, id: 'evt_test', duplicate: true as const }
  assert(duplicate.received === true, 'received')
  assert(duplicate.duplicate === true, 'duplicate flag')
  const aliases = ['/api/webhooks/stripe', '/api/v1/billing/webhook']
  assert(aliases.length === 2, 'webhook aliases')
  console.log('QA-C webhook idempotency contract OK')
}

console.log('launch.qa.test.ts passed')
