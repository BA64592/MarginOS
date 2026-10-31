import type { AnalysisResult, Leak } from '../types'

/** Prefer colon titles (v17.1 app-fixes / C11 recommendation). */
export function leakTitleWithColon(title: string): string {
  return title.replace(/\s—\s/g, ': ')
}

/**
 * Free session must not expose £ impact / profit fields (10.1 criteria 4, 15, 16; K14).
 * Keeps trigger in words + % only.
 */
export function sanitizeLeakForFree(leak: Leak): Leak {
  const title = leakTitleWithColon(leak.title)
  let description = leak.description
  // Strip any currency amounts that slipped into the trigger text.
  description = description.replace(/[£$€]|CA\$|A\$|USD|GBP|EUR|CAD|AUD/gi, '')
  description = description.replace(/\s{2,}/g, ' ').trim()

  if (leak.leakType === 'loss_making_product') {
    const marginMatch = leak.description.match(/([-−]?\d+(?:\.\d+)?)%/)
    const margin = marginMatch?.[1] ?? null
    description =
      margin != null
        ? `Losing money: net margin ${margin.startsWith('-') || margin.startsWith('−') ? margin : `−${margin}`}%`
        : 'Losing money: net margin below zero'
  }

  return {
    ...leak,
    title,
    description,
    monthlyImpact: 0,
    recommendation: '',
    maths: [],
  }
}

function freeHeadlineAction(result: AnalysisResult): string {
  const top = result.leaks[0]
  if (!top) return result.headlineAction
  // K15: Free headline may name the product / target price, never a leak £ cost.
  const name = top.productName
  const priceMatch = top.recommendation.match(/Raise price to ([^.]+)\./)
  if (name && priceMatch) {
    return `${name}: raise price to ${priceMatch[1].trim()}.`
  }
  if (name) return `${name}: fix this ${top.leakType.replace(/_/g, ' ')} first.`
  return leakTitleWithColon(top.title)
}

export function sanitizeResultForFree(result: AnalysisResult): AnalysisResult {
  const leaks = result.leaks.slice(0, 3).map(sanitizeLeakForFree)
  return {
    ...result,
    leaks,
    headlineAction: freeHeadlineAction(result),
  }
}
