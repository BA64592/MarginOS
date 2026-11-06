import { roundHalfUp, roundMoney } from './money'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(roundHalfUp(1.005, 2) === 1.01, `1.005 → 1.01 got ${roundHalfUp(1.005, 2)}`)
assert(roundHalfUp(1.004, 2) === 1, `1.004 → 1 got ${roundHalfUp(1.004, 2)}`)
assert(roundHalfUp(1.015, 2) === 1.02, `1.015 → 1.02 got ${roundHalfUp(1.015, 2)}`)
assert(roundHalfUp(2.675, 2) === 2.68, `2.675 → 2.68 got ${roundHalfUp(2.675, 2)}`)
assert(roundHalfUp(-1.005, 2) === -1.01, `-1.005 → -1.01 got ${roundHalfUp(-1.005, 2)}`)
assert(roundMoney(10) === 10, 'roundMoney 10')

console.log('money.test.ts: all assertions passed')
