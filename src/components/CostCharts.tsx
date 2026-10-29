import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { formatGbp } from '../lib/format'
import { Card, SectionHeading } from './ui'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#64748b',
]

export function CostCharts() {
  const { result } = useApp()
  const t = result.totals

  const breakdown = [
    { name: 'Product cost', value: t.productCostTotal },
    { name: 'Shipping', value: t.shippingTotal },
    { name: 'Ads', value: t.adSpend },
    { name: 'Platform fees', value: t.platformFees },
    { name: 'Returns impact', value: t.refunds + t.returnHandlingCost },
    { name: 'True profit', value: Math.max(0, t.trueProfit) },
  ].filter((d) => d.value > 0)

  const byProduct = result.products.map((p) => ({
    name: p.product.name.length > 16 ? `${p.product.name.slice(0, 14)}…` : p.product.name,
    profit: Math.round(p.trueProfit),
    revenue: Math.round(p.grossRevenue),
  }))

  return (
    <section>
      <SectionHeading
        eyebrow="Visuals"
        title="Where the money goes"
        description="Cost mix across the catalogue and true profit by product."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-[320px]">
          <p className="mb-3 text-sm font-semibold text-ink">Revenue allocation</p>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {breakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatGbp(Number(value), true)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="h-[320px]">
          <p className="mb-3 text-sm font-semibold text-ink">True profit by product</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={byProduct} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                formatter={(value) => formatGbp(Number(value), true)}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                }}
              />
              <Bar dataKey="profit" name="True profit" radius={[8, 8, 0, 0]} fill="var(--chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  )
}
