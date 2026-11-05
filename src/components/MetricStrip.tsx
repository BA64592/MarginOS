import { Activity, Percent, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatMoney, formatPct } from '../lib/format'
import { cn } from '../lib/cn'
import { MathsDisclosure } from './MathsDisclosure'
import { Card } from './ui'

export function MetricStrip() {
  const { result, currency, usingSampleData, isEmptyShop } = useApp()
  const band = result.health.band
  const tone =
    band === 'Strong' ? 'ok' : band === 'Needs attention' ? 'warn' : band === 'At risk' ? 'danger' : 'neutral'

  if (isEmptyShop) {
    return (
      <Card className="animate-fade-up">
        <p className="text-sm font-semibold text-ink">No results yet</p>
        <p className="mt-1 text-sm text-subtle">
          Upload your orders to see true profit, net margin and Health Score.
        </p>
      </Card>
    )
  }

  const items = [
    {
      label: 'True profit',
      value: formatMoney(result.totals.trueProfit, currency),
      hint: 'Contribution margin − ads − conversion fees − overheads',
      icon: Wallet,
      // Brand §14 / §22: true-profit figure uses navy text (not semantic green)
      accent: result.totals.trueProfit >= 0 ? 'text-navy dark:text-white' : 'text-danger',
      maths: [
        `Revenue ${formatMoney(result.totals.revenue, currency)} (product + shipping charged − discounts; tax excluded).`,
        `Contribution margin ${formatMoney(result.totals.contributionMargin, currency)} (${formatPct(result.totals.contributionMarginPct)}).`,
        `True profit = contribution margin − ads ${formatMoney(result.totals.adSpend, currency)} − conversion ${formatMoney(result.totals.conversionFees, currency)} − overheads ${formatMoney(result.totals.overheads, currency)}.`,
      ],
    },
    {
      label: 'Net margin',
      value: formatPct(result.totals.netMarginPct),
      hint: `${formatMoney(result.totals.revenue, currency)} revenue`,
      icon: Percent,
      accent: 'text-ink',
      maths: [`Net margin = true profit ÷ revenue = ${formatPct(result.totals.netMarginPct)}.`],
    },
    {
      label: 'Health score',
      value: result.health.score == null ? '—' : `${result.health.score}`,
      hint: `${band ?? 'No score'} · ${result.health.confidence} confidence`,
      icon: Activity,
      accent:
        tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink',
      maths: [
        ...result.health.maths,
        ...result.health.confidenceReasons.map((r) => `Confidence: ${r}`),
      ],
    },
  ]

  return (
    <div className="space-y-3">
      {usingSampleData ? (
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-warn">Sample data</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item, i) => (
        <Card
          key={item.label}
          className={cn(
            'animate-fade-up !shadow-none',
            i === 1 && 'delay-75',
            i === 2 && 'delay-150',
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{item.label}</p>
            <item.icon className="h-4 w-4 text-subtle" aria-hidden />
          </div>
          <p className={cn('font-display text-3xl font-semibold tracking-tight sm:text-4xl', item.accent)}>
            {item.value}
            {item.label === 'Health score' && result.health.score != null ? (
              <span className="text-base font-medium text-subtle"> / 100</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-subtle sm:text-sm">{item.hint}</p>
          <MathsDisclosure lines={item.maths} />
        </Card>
      ))}
      </div>
    </div>
  )
}
