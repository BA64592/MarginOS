import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboardFilters } from './dashboard/DashboardShell'
import { useApp } from '../context/AppContext'
import { hasPaidAccess } from '../lib/plans'
import { formatMoney, formatPct } from '../lib/format'
import { Card, SectionHeading } from './ui'

/** Brand §22 — category ink only (teal / navy / slate). Semantic red reserved for losses. */
const CATEGORY_COLORS = [
  '#34726B',
  '#061F45',
  '#64748B',
  '#7FC4BA',
  '#AEBBD0',
  '#475569',
]

const LOSS = '#C21F3E'

type TipPayload = { name?: string; value?: number; payload?: { name?: string; anomaly?: boolean } }

function ChartTooltipContent({
  active,
  payload,
  label,
  formatValue,
  periodLabel,
}: {
  active?: boolean
  payload?: TipPayload[]
  label?: string
  formatValue: (n: number) => string
  periodLabel?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]
  const name = row.name ?? row.payload?.name ?? label
  const value = Number(row.value ?? 0)
  return (
    <div className="rounded-[10px] border border-border bg-elevated px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-ink">{name}</p>
      <p className={`mt-0.5 font-display text-sm font-semibold ${row.payload?.anomaly ? 'text-danger' : 'text-navy'}`}>
        {formatValue(value)}
      </p>
      {periodLabel ? <p className="mt-1 text-[11px] text-subtle">{periodLabel}</p> : null}
    </div>
  )
}

export function CostCharts() {
  const { access, result, currency, usingSampleData, isEmptyShop } = useApp()
  const filters = useDashboardFilters()
  if (isEmptyShop) return null
  const t = result.totals
  const periodLabel = `${t.period.start} → ${t.period.end}`

  const breakdown = [
    { name: 'Product + packaging', value: t.productPackagingCost },
    { name: 'Shipping cost', value: t.shippingCost },
    { name: 'Fees', value: t.fees },
    { name: 'Return cost', value: t.returnCost },
    { name: 'Ads', value: t.adSpend },
    { name: 'True profit', value: Math.max(0, t.trueProfit) },
  ].filter((d) => d.value > 0)

  const selected = filters?.selected
  const products = result.products.filter((p) => {
    if (!selected || selected.size === 0) return true
    return p.platforms.some((pl) => selected.has(pl))
  })

  const byProduct = products.slice(0, 10).map((p) => {
    const value = !hasPaidAccess(access) ? Math.round(p.netMarginPct * 10) / 10 : Math.round(p.netProfit)
    return {
      name: p.name,
      value,
      anomaly: value < 0,
    }
  })

  const moneyTick = (value: number) => formatMoney(value, currency, true)
  const pctTick = (value: number) => `${value}%`
  const allocationAlt = breakdown
    .map((d) => `${d.name}: ${formatMoney(d.value, currency)}`)
    .join('; ')
  const productAlt =
    !hasPaidAccess(access)
      ? byProduct.map((d) => `${d.name}: ${formatPct(d.value)}`).join('; ')
      : byProduct.map((d) => `${d.name}: ${formatMoney(d.value, currency)}`).join('; ')

  const formatBar = (value: number) =>
    !hasPaidAccess(access) ? formatPct(value) : formatMoney(value, currency, true)

  return (
    <section>
      <SectionHeading
        eyebrow="Visuals"
        title="Where the money goes"
        description={
          usingSampleData
            ? 'Sample data — cost mix and true profit by product for the demo period.'
            : !hasPaidAccess(access)
              ? 'Cost mix and net margin % by product. Per-product £ unlocks on Growth and above.'
              : 'Cost mix and true profit by product for the current period.'
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-[360px] !shadow-none">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Allocation</p>
            <p className="text-[11px] text-subtle">Share of period costs</p>
          </div>
          <p className="sr-only">Allocation chart text alternative: {allocationAlt || 'No costs.'}</p>
          <ResponsiveContainer width="100%" height="78%">
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={3}
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {breakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatValue={(n) => formatMoney(n, currency)}
                    periodLabel={periodLabel}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-subtle" aria-hidden>
            {breakdown.map((d, i) => (
              <li key={d.name} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                {d.name}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-[400px] !shadow-none">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {!hasPaidAccess(access) ? 'Net margin % by product' : 'True profit by product'}
            </p>
            <p className="text-[11px] text-subtle">Losses in red</p>
          </div>
          <p className="sr-only">Product chart text alternative: {productAlt || 'No products.'}</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={byProduct} margin={{ top: 8, right: 8, left: 4, bottom: 64 }}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.55} vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-28}
                textAnchor="end"
                height={72}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={!hasPaidAccess(access) ? pctTick : moneyTick}
                width={64}
              />
              <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 4" strokeOpacity={0.7} />
              <Tooltip
                cursor={{ fill: 'var(--bg-muted)', opacity: 0.45 }}
                content={<ChartTooltipContent formatValue={formatBar} periodLabel={periodLabel} />}
              />
              <Bar
                dataKey="value"
                name={!hasPaidAccess(access) ? 'Net margin %' : 'True profit'}
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              >
                {byProduct.map((entry) => (
                  <Cell key={entry.name} fill={entry.anomaly ? LOSS : '#34726B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  )
}
