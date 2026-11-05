import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { hasPaidAccess } from '../lib/plans'
import { formatMoney, formatPct } from '../lib/format'
import { Card, SectionHeading } from './ui'

/** Spec v17.1 §22.7 — chart categories only (never semantic green/amber/red). */
const CATEGORY_COLORS = [
  '#34726B', // brand teal
  '#061F45', // navy
  '#64748B', // slate
  '#6D5BD0', // violet
  '#7FC4BA', // light teal
  '#AEBBD0', // light slate
]

export function CostCharts() {
  const { access, result, currency, usingSampleData, isEmptyShop } = useApp()
  if (isEmptyShop) return null
  const t = result.totals
  const breakdown = [
    { name: 'Product + packaging', value: t.productPackagingCost },
    { name: 'Shipping cost', value: t.shippingCost },
    { name: 'Fees', value: t.fees },
    { name: 'Return cost', value: t.returnCost },
    { name: 'Ads', value: t.adSpend },
    { name: 'True profit', value: Math.max(0, t.trueProfit) },
  ].filter((d) => d.value > 0)

  const byProduct = result.products.slice(0, 10).map((p) => ({
    name: p.name,
    // Free: net margin % only (v17.1 recommendation — avoid per-product £ that reveals leak impact).
    value: !hasPaidAccess(access) ? Math.round(p.netMarginPct * 10) / 10 : Math.round(p.netProfit),
  }))

  const moneyTick = (value: number) => formatMoney(value, currency, true)
  const pctTick = (value: number) => `${value}%`
  const allocationAlt = breakdown
    .map((d) => `${d.name}: ${formatMoney(d.value, currency)}`)
    .join('; ')
  const productAlt =
    !hasPaidAccess(access)
      ? byProduct.map((d) => `${d.name}: ${formatPct(d.value)}`).join('; ')
      : byProduct.map((d) => `${d.name}: ${formatMoney(d.value, currency)}`).join('; ')

  return (
    <section>
      <SectionHeading
        eyebrow="Visuals"
        title="Where the money goes"
        description={
          usingSampleData
            ? 'Sample data — cost mix and true profit by product for the demo period.'
            : !hasPaidAccess(access)
              ? 'Cost mix and net margin % by product. Per-product £ unlocks in Pro.'
              : 'Cost mix and true profit by product for the current period.'
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-[360px]">
          <p className="mb-3 text-sm font-semibold text-ink">Allocation</p>
          <p className="sr-only">Allocation chart text alternative: {allocationAlt || 'No costs.'}</p>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={2}
                stroke="#FFFFFF"
                strokeWidth={1}
              >
                {breakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="name"
                  position="outside"
                  className="fill-[var(--text-muted)] text-[10px]"
                />
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(Number(value), currency)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-subtle" aria-hidden>
            {breakdown.map((d, i) => (
              <li key={d.name} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                {d.name}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="h-[400px]">
          <p className="mb-3 text-sm font-semibold text-ink">
            {!hasPaidAccess(access) ? 'Net margin % by product' : 'True profit by product'}
          </p>
          <p className="sr-only">Product chart text alternative: {productAlt || 'No products.'}</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={byProduct} margin={{ top: 8, right: 12, left: 8, bottom: 72 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-28}
                textAnchor="end"
                height={80}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={!hasPaidAccess(access) ? pctTick : moneyTick}
                width={72}
              />
              <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 4" />
              <Tooltip
                formatter={(value) =>
                  !hasPaidAccess(access)
                    ? formatPct(Number(value))
                    : formatMoney(Number(value), currency, true)
                }
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                }}
              />
              <Bar
                dataKey="value"
                name={!hasPaidAccess(access) ? 'Net margin %' : 'True profit'}
                radius={[8, 8, 0, 0]}
                fill="#34726B"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  )
}
