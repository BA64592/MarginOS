/** Decimal half-up helpers (spec §12.3). Avoid binary float drift for money/margins. */

export function roundHalfUp(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** decimals
  const shifted = value * factor
  const sign = shifted < 0 ? -1 : 1
  const abs = Math.abs(shifted)
  const whole = Math.floor(abs)
  const frac = abs - whole
  // Exactly 0.5 → round away from zero (half-up)
  const rounded = frac >= 0.5 - Number.EPSILON ? whole + 1 : whole
  return (sign * rounded) / factor
}

export function roundMoney(value: number) {
  return roundHalfUp(value, 2)
}

export function roundPct(value: number) {
  return roundHalfUp(value, 1)
}

export function roundScore(value: number) {
  return roundHalfUp(value, 0)
}

export function roundWholeCurrency(value: number) {
  return roundHalfUp(value, 0)
}

/** Split an order-level amount across lines by line value; remainder to last line. */
export function allocateByLineValue(
  amount: number,
  lineValues: number[],
): number[] {
  const n = lineValues.length
  if (n === 0) return []
  const total = lineValues.reduce((a, b) => a + b, 0)
  if (total <= 0) {
    const units = lineValues.map(() => 1)
    return allocateByLineValue(amount, units)
  }
  const raw = lineValues.map((v) => roundMoney((amount * v) / total))
  const sum = raw.reduce((a, b) => a + b, 0)
  const diff = roundMoney(amount - sum)
  raw[n - 1] = roundMoney(raw[n - 1] + diff)
  return raw
}
