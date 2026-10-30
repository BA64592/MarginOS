import { convertImportToHomeCurrency } from '../fx/convertOrders'
import type { AdSpendEntry, HomeCurrency, OrderLine, Platform } from '../types'
import { parseAmazonTransactionCsv } from './amazon'
import { parseEtsyOrdersAndItems } from './etsy'
import { applyShopifyPaymentFees, parseShopifyOrdersCsv } from './shopify'

function withFx(
  lines: OrderLine[],
  ads: AdSpendEntry[],
  home: HomeCurrency,
  base: Omit<PlatformImportOutput, 'lines' | 'ads'> & { lines?: OrderLine[]; ads?: AdSpendEntry[] },
): PlatformImportOutput {
  const fx = convertImportToHomeCurrency(lines, ads, home)
  if (!fx.lines.length && lines.length) {
    return {
      ok: false,
      lines: [],
      ads: [],
      errors: [
        ...(base.errors ?? []),
        fx.warnings[0] || 'No orders left after currency conversion.',
      ],
      warnings: [...(base.warnings ?? []), ...fx.warnings],
      mathsNotes: [...(base.mathsNotes ?? []), ...fx.mathsNotes],
      summary: base.summary ?? {},
    }
  }
  return {
    ok: true,
    lines: fx.lines,
    ads: fx.ads,
    errors: [],
    warnings: [...(base.warnings ?? []), ...fx.warnings],
    mathsNotes: [...(base.mathsNotes ?? []), ...fx.mathsNotes],
    summary: base.summary ?? {},
  }
}

export type PlatformImportInput = {
  platform: Platform
  homeCurrency: HomeCurrency
  /** Primary file (Shopify Orders / Amazon Transaction / unused for Etsy multi) */
  primaryCsv?: string
  shopifyPaymentsCsv?: string
  etsyOrdersCsv?: string
  etsyItemsCsv?: string
  etsyStatementCsv?: string
}

export type PlatformImportOutput = {
  ok: boolean
  lines: OrderLine[]
  ads: AdSpendEntry[]
  errors: string[]
  warnings: string[]
  mathsNotes: string[]
  summary: Record<string, number | string>
}

export function importPlatformFiles(input: PlatformImportInput): PlatformImportOutput {
  const mathsNotes: string[] = []
  if (input.platform === 'shopify') {
    if (!input.primaryCsv) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: ['Shopify Orders CSV is required.'],
        warnings: [],
        mathsNotes,
        summary: {},
      }
    }
    const parsed = parseShopifyOrdersCsv(input.primaryCsv, input.homeCurrency)
    if (parsed.errors.length) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: parsed.errors,
        warnings: parsed.warnings,
        mathsNotes,
        summary: parsed.summary,
      }
    }
    let lines = parsed.lines
    const warnings = [...parsed.warnings]
    if (input.shopifyPaymentsCsv) {
      const fees = applyShopifyPaymentFees(lines, input.shopifyPaymentsCsv)
      lines = fees.lines
      warnings.push(...fees.warnings)
      if (fees.mathsNote) mathsNotes.push(fees.mathsNote)
    } else {
      warnings.push(
        'Shopify Payments transactions export not uploaded — payment fees labelled estimated.',
      )
    }
    return withFx(lines, [], input.homeCurrency, {
      ok: true,
      errors: [],
      warnings,
      mathsNotes,
      summary: parsed.summary,
    })
  }

  if (input.platform === 'etsy') {
    if (!input.etsyOrdersCsv || !input.etsyItemsCsv) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: ['Etsy requires Orders and Order Items CSVs (missing file named in message).'],
        warnings: [],
        mathsNotes,
        summary: {},
      }
    }
    const parsed = parseEtsyOrdersAndItems({
      ordersCsv: input.etsyOrdersCsv,
      itemsCsv: input.etsyItemsCsv,
      statementCsv: input.etsyStatementCsv,
      homeCurrency: input.homeCurrency,
    })
    if (parsed.errors.length) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: parsed.errors,
        warnings: parsed.warnings,
        mathsNotes,
        summary: parsed.summary,
      }
    }
    return withFx(parsed.lines, parsed.ads, input.homeCurrency, {
      ok: true,
      errors: [],
      warnings: parsed.warnings,
      mathsNotes,
      summary: parsed.summary,
    })
  }

  if (input.platform === 'amazon') {
    if (!input.primaryCsv) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: ['Amazon Transaction report CSV is required.'],
        warnings: [],
        mathsNotes,
        summary: {},
      }
    }
    const parsed = parseAmazonTransactionCsv(input.primaryCsv, input.homeCurrency)
    if (parsed.errors.length) {
      return {
        ok: false,
        lines: [],
        ads: [],
        errors: parsed.errors,
        warnings: parsed.warnings,
        mathsNotes,
        summary: parsed.summary,
      }
    }
    mathsNotes.push(
      'Amazon dates are posting dates. Payment processing is part of selling fees — one compared fee type (referral).',
    )
    return withFx(parsed.lines, parsed.ads, input.homeCurrency, {
      ok: true,
      errors: [],
      warnings: parsed.warnings,
      mathsNotes,
      summary: { ...parsed.summary, overheadHints: parsed.overheadHints },
    })
  }

  return {
    ok: false,
    lines: [],
    ads: [],
    errors: ['Unknown platform.'],
    warnings: [],
    mathsNotes,
    summary: {},
  }
}
