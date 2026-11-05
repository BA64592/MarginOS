import { CopyPlus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { hasFeature } from '../lib/plans'
import { formatMoney, formatPct } from '../lib/format'
import { SliderField } from './SliderField'
import { Button, Card, Input, SectionHeading } from './ui'
import { ProGate } from './ProGate'

function ScenarioInner() {
  const { scenarios,
    scenarioResults,
    createScenario,
    updateScenario,
    removeScenario,
    currency,
  } = useApp()

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={createScenario}>
        <CopyPlus className="h-4 w-4" />
        New scenario
      </Button>
      <p className="text-xs text-subtle">
        Units sold stay the same (no demand modelling). Changing price holds ad spend per unit at the current
        amount.
      </p>
      {!scenarios.length ? (
        <Card>
          <p className="text-sm text-subtle">
            No scenarios yet. Add at least two after you upload orders (Start fresh clears these).
          </p>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {scenarioResults.map(({ scenario, result }) => (
          <Card key={scenario.id}>
            <div className="mb-3 flex items-start gap-2">
              <Input
                value={scenario.name}
                onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                className="font-semibold"
              />
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-danger"
                disabled={scenarios.length <= 1}
                onClick={() => removeScenario(scenario.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <Metric label="Profit" value={formatMoney(result.totals.trueProfit, currency, true)} />
              <Metric label="Margin" value={formatPct(result.totals.netMarginPct)} />
              <Metric label="Score" value={`${result.health.score ?? '—'}`} />
            </div>
            <div className="space-y-3">
              {(
                [
                  ['pricePct', 'Price'],
                  ['productCostPct', 'Product cost'],
                  ['adSpendPct', 'Ad spend'],
                  ['returnRatePct', 'Return rate'],
                  ['shippingChargePct', 'Shipping charge'],
                  ['discountPct', 'Discount'],
                ] as const
              ).map(([key, label]) => (
                <SliderField
                  key={key}
                  label={label}
                  value={scenario.adjustments[key]}
                  min={-40}
                  max={40}
                  step={1}
                  suffix="%"
                  onChange={(v) =>
                    updateScenario(scenario.id, {
                      adjustments: { ...scenario.adjustments, [key]: v },
                    })
                  }
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/80 px-2 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="font-display text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

export function ScenarioCompare() {
  const { plan } = useApp()
  return (
    <section>
      <SectionHeading
        eyebrow="What-ifs"
        title="Scenario comparison"
        description="At least two side-by-side scenarios — price, cost, ads, returns, shipping charge, discount."
      />
      {hasFeature(plan, 'scenarios') ? (
        <ScenarioInner />
      ) : (
        <ProGate label="Scenario comparison — Pro">
          <ScenarioInner />
        </ProGate>
      )}
    </section>
  )
}
