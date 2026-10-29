import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { calcBreakEvenPrice, calcTargetPrice } from '../lib/calc/targetPrice'
import { formatMoney, formatPct } from '../lib/format'
import { Card, Input, SectionHeading } from './ui'
import { MathsDisclosure } from './MathsDisclosure'

export function CalculatorsPanel() {
  const { result, currency, targetMarginPct, setTargetMarginPct, plan } = useApp()
  const [sku, setSku] = useState(result.products[0]?.sku ?? '')
  const product = result.products.find((p) => p.sku === sku) ?? result.products[0]

  const calc = useMemo(() => {
    if (!product) return null
    const units = Math.max(1, product.unitsSold)
    const unitCombined = product.productPackagingCost / units
    const input = {
      unitCost: unitCombined,
      packaging: 0,
      perUnitShippingCost: product.shippingCost / units,
      perUnitAdCost: product.adSpendShare / units,
      fixedFeesPerUnit: 0,
      percentageFees: product.revenue > 0 ? product.fees / product.revenue : 0,
      returnCostRate: product.returnCostRate,
      perUnitShippingCharged: product.shippingCharged / units,
      currentAveragePrice: product.revenue / units,
      targetMargin: targetMarginPct / 100,
      currency,
    }
    const target = calcTargetPrice(input)
    const breakeven = calcBreakEvenPrice(input)
    const beRoas =
      product.contributionMarginPct <= 0
        ? 'not reachable'
        : 1 / (product.contributionMarginPct / 100)
    const beAcos = product.contributionMarginPct <= 0 ? null : product.contributionMarginPct
    return { target, breakeven, beRoas, beAcos, unitCombined }
  }, [product, targetMarginPct, currency])

  if (!product || !calc) {
    return (
      <section>
        <SectionHeading eyebrow="Calculators" title="Unit economics" description="Load products to use the calculators." />
      </section>
    )
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Calculators"
        title="Break-even & target price"
        description="Pick a product to see break-even ROAS, ACOS, break-even price and the price that hits your target margin."
      />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
              Product
            </span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm"
              value={product.sku}
              onChange={(e) => setSku(e.target.value)}
            >
              {(plan === 'pro' ? result.products : result.products.slice(0, 10)).map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
              Target margin % {plan === 'pro' ? '(Pro editable)' : '(default 10%)'}
            </span>
            <Input
              type="number"
              min={0}
              max={80}
              step={0.5}
              value={targetMarginPct}
              disabled={plan !== 'pro'}
              onChange={(e) => setTargetMarginPct(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/80 px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-subtle">Break-even ROAS</p>
            <p className="font-display text-xl font-semibold text-ink">
              {calc.beRoas === 'not reachable' ? 'Not reachable' : `${(calc.beRoas as number).toFixed(2)}×`}
            </p>
            <MathsDisclosure
              lines={[
                `Break-even ROAS = 1 ÷ contribution margin % = 1 ÷ ${formatPct(product.contributionMarginPct)}.`,
              ]}
            />
          </div>
          <div className="rounded-xl bg-muted/80 px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-subtle">Break-even ACOS</p>
            <p className="font-display text-xl font-semibold text-ink">
              {calc.beAcos == null ? '—' : formatPct(calc.beAcos)}
            </p>
            <MathsDisclosure
              lines={[
                'Break-even ACOS = contribution margin % (ads can take up to this share of revenue).',
              ]}
            />
          </div>
          <div className="rounded-xl bg-muted/80 px-3 py-3">
            <p className="text-xs uppercase tracking-wide text-subtle">Break-even price</p>
            <p className="font-display text-xl font-semibold text-ink">
              {calc.breakeven.price == null ? '—' : formatMoney(calc.breakeven.price, currency)}
            </p>
            <MathsDisclosure lines={calc.breakeven.maths} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-accent/25 bg-accent-soft/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Target-margin price ({targetMarginPct}%)
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {calc.target.price == null ? '—' : formatMoney(calc.target.price, currency)}
          </p>
          <p className="mt-1 text-sm text-subtle">{calc.target.note}</p>
          <MathsDisclosure lines={calc.target.maths} />
        </div>
      </Card>
    </section>
  )
}
