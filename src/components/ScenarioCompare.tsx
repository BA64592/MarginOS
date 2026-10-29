import { CopyPlus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatGbp, formatPct } from '../lib/format'
import { SliderField } from './SliderField'
import { Badge, Button, Card, Input, SectionHeading } from './ui'
import { ProGate } from './ProGate'

function ScenarioInner() {
  const {
    scenarios,
    scenarioResults,
    createScenarioFromCurrent,
    setScenarioAdjustments,
    updateScenario,
    removeScenario,
  } = useApp()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => createScenarioFromCurrent()}>
          <CopyPlus className="h-4 w-4" />
          New scenario from current
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {scenarioResults.map(({ scenario, result }) => (
          <Card key={scenario.id} className="flex flex-col">
            <div className="mb-3 flex items-start justify-between gap-2">
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
                aria-label="Remove scenario"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <Metric label="Profit" value={formatGbp(result.totals.trueProfit)} />
              <Metric label="Margin" value={formatPct(result.totals.marginPct)} />
              <Metric label="Score" value={`${result.healthScore}`} />
            </div>

            <div className="space-y-4">
              <SliderField
                label="Price adjustment"
                value={scenario.adjustments.pricePct}
                min={-30}
                max={40}
                step={1}
                suffix="%"
                onChange={(pricePct) =>
                  setScenarioAdjustments(scenario.id, { ...scenario.adjustments, pricePct })
                }
              />
              <SliderField
                label="Ad spend"
                value={scenario.adjustments.adSpendPct}
                min={-50}
                max={50}
                step={1}
                suffix="%"
                onChange={(adSpendPct) =>
                  setScenarioAdjustments(scenario.id, { ...scenario.adjustments, adSpendPct })
                }
              />
              <SliderField
                label="Return rate"
                value={scenario.adjustments.returnRatePct}
                min={-50}
                max={50}
                step={1}
                suffix="%"
                onChange={(returnRatePct) =>
                  setScenarioAdjustments(scenario.id, {
                    ...scenario.adjustments,
                    returnRatePct,
                  })
                }
              />
              <SliderField
                label="Product cost"
                value={scenario.adjustments.productCostPct}
                min={-30}
                max={30}
                step={1}
                suffix="%"
                onChange={(productCostPct) =>
                  setScenarioAdjustments(scenario.id, {
                    ...scenario.adjustments,
                    productCostPct,
                  })
                }
              />
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                Top leak
              </p>
              {result.leaks[0] ? (
                <div>
                  <Badge tone="warn">{result.leaks[0].title}</Badge>
                  <p className="mt-2 text-xs text-subtle">
                    {formatGbp(result.leaks[0].monthlyImpactGbp)} / mo
                  </p>
                </div>
              ) : (
                <p className="text-sm text-subtle">Within benchmarks</p>
              )}
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
      <p className="font-display text-sm font-semibold text-ink sm:text-base">{value}</p>
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
        description="Build side-by-side scenarios and compare profit and Health Score."
      />
      {plan === 'pro' ? (
        <ScenarioInner />
      ) : (
        <ProGate label="Scenario comparison — Pro">
          <ScenarioInner />
        </ProGate>
      )}
    </section>
  )
}
