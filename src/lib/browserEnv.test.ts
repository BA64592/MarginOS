import { isInAppBrowser, isLikelyUnsupportedBrowser } from './browserEnv'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(isInAppBrowser('Mozilla/5.0 Instagram 300.0'), 'instagram in-app')
assert(isInAppBrowser('FBAN/FBIOS'), 'facebook in-app')
assert(!isInAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit Safari'), 'safari not in-app')
assert(isLikelyUnsupportedBrowser('Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)'), 'ie')
assert(!isLikelyUnsupportedBrowser('Mozilla/5.0 Chrome/120.0.0.0'), 'chrome ok')

console.log('browserEnv.test.ts: all assertions passed')
