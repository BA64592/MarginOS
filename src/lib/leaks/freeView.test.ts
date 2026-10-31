import { sanitizeLeakForFree, leakTitleWithColon } from './freeView'
import type { Leak } from '../types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(leakTitleWithColon('Loss-making product — Gift') === 'Loss-making product: Gift', 'colon')

const loss: Leak = {
  id: '1',
  leakType: 'loss_making_product',
  title: 'Loss-making product: Seasonal Gift Box',
  description: 'Losing money: net margin -15.1%.',
  monthlyImpact: 211,
  recommendation: 'Raise price to £40.',
  maths: ['Monthly loss £211'],
  productName: 'Seasonal Gift Box',
}

const free = sanitizeLeakForFree(loss)
assert(free.monthlyImpact === 0, 'no impact')
assert(!free.description.includes('£'), 'no pound in description')
assert(!free.recommendation.includes('£'), 'recommendation cleared')
assert(free.maths.length === 0, 'maths cleared')
assert(free.description.includes('15.1'), 'keeps margin %')

console.log('freeView.test.ts: all assertions passed')
