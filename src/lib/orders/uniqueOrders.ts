/**
 * v18 §12.4 — unique orders counted once per billing-month usage period.
 * projected = |U ∪ N|; import only when projected ≤ L (whole-file block otherwise).
 */
import type { OrderLine } from '../types'

export function uniqueOrderIds(lines: OrderLine[]): Set<string> {
  const set = new Set<string>()
  for (const l of lines) {
    if (l.isSample) continue
    if (l.orderId) set.add(l.orderId)
  }
  return set
}

export function evaluateOrderImport(args: {
  existing: OrderLine[]
  incoming: OrderLine[]
  limit: number
}): {
  existingUnique: number
  newUnique: number
  projected: number
  overage: number
  allowed: boolean
} {
  const U = uniqueOrderIds(args.existing)
  const N = new Set<string>()
  for (const l of args.incoming) {
    if (l.isSample) continue
    if (l.orderId && !U.has(l.orderId)) N.add(l.orderId)
  }
  const projected = U.size + N.size
  const overage = Math.max(0, projected - args.limit)
  return {
    existingUnique: U.size,
    newUnique: N.size,
    projected,
    overage,
    allowed: projected <= args.limit,
  }
}

export function usageWarningAt80(used: number, limit: number): boolean {
  if (limit <= 0) return false
  return used / limit >= 0.8 && used < limit
}
