/**
 * Shopify PII strip warnings (QA handoff B7 / §10.2.1).
 * Run via: npx tsx src/lib/csv/shopify.pii.test.ts
 */
import { parseShopifyOrdersCsv } from './shopify'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const csv = [
  'Id,Name,Email,Billing Name,Shipping Address1,Lineitem quantity,Lineitem price,Currency,Created at,Financial Status',
  '1,#1001,buyer@example.com,Jane Buyer,1 High Street,2,10.00,GBP,2026-10-01,paid',
].join('\n')

const result = parseShopifyOrdersCsv(csv, 'GBP')
assert(result.errors.length === 0, 'no parse errors')
assert(result.lines.length === 1, 'one line imported')
assert(
  result.warnings.some((w) => w.includes('Personal data columns were removed')),
  'PII strip warning present',
)
assert(
  result.warnings.some((w) => w.includes('Email') && w.includes('Billing Name')),
  'names stripped columns in warning',
)
// Ensure personal fields are not on the order line
const line = result.lines[0]
assert(!('email' in line), 'email not stored')
assert(!('billingName' in line), 'billing name not stored')

const clean = parseShopifyOrdersCsv(
  [
    'Id,Name,Lineitem quantity,Lineitem price,Currency,Created at,Financial Status',
    '1,#1001,1,5.00,GBP,2026-10-01,paid',
  ].join('\n'),
  'GBP',
)
assert(
  !clean.warnings.some((w) => w.includes('Personal data columns')),
  'no PII warning when columns absent',
)

console.log('shopify.pii.test.ts: all assertions passed')
