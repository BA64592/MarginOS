import { Activity, Percent, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { healthTone } from '../lib/calc'
import { formatGbp, formatPct } from '../lib/format'
import { cn } from '../lib/cn'
import { Card } from './ui'

export function MetricStrip() {
  const { result } = useApp()
  const tone = healthTone(result.healthScore)

  const items = [
    {
      label: 'True profit',
      value: formatGbp(result.totals.trueProfit),
      hint: 'After COGS, shipping, ads, fees & returns',
      icon: Wallet,
      accent: result.totals.trueProfit >= 0 ? 'text-ok' : 'text-danger',
    },
    {
      label: 'Net margin',
      value: formatPct(result.totals.marginPct),
      hint: `${formatGbp(result.totals.grossRevenue)} gross · ${formatGbp(result.totals.netRevenue)} net`,
      icon: Percent,
      accent: 'text-ink',
    },
    {
      label: 'Health score',
      value: `${result.healthScore}`,
      hint: '0–100 across margin, ads, returns, fees, COGS',
      icon: Activity,
      accent:
        tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-danger',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item, i) => (
        <Card
          key={item.label}
          className={cn('animate-fade-up', i === 1 && 'delay-75', i === 2 && 'delay-150')}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
              {item.label}
            </p>
            <item.icon className="h-4 w-4 text-subtle" />
          </div>
          <p className={cn('font-display text-3xl font-semibold tracking-tight', item.accent)}>
            {item.value}
            {item.label === 'Health score' ? (
              <span className="text-base font-medium text-subtle"> / 100</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-subtle sm:text-sm">{item.hint}</p>
        </Card>
      ))}
    </div>
  )
}
