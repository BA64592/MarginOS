import { ArrowDownRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatMoney } from '../lib/format'
import { Badge, Card, SectionHeading } from './ui'
import { MathsDisclosure } from './MathsDisclosure'

export function LeaksPanel() {
  const { result, currency } = useApp()

  return (
    <section>
      <SectionHeading
        eyebrow="Margin leaks"
        title="Ranked by monthly impact"
        description="Every margin leak with monthly impact in your home currency, largest first. Included on every plan."
      />

      {!result.leaks.length ? (
        <Card>
          <p className="text-sm text-subtle">No launch leaks triggered for this period.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {result.leaks.map((leak, index) => (
            <Card key={leak.id} interactive>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">#{index + 1}</Badge>
                    {leak.estimated ? <Badge tone="warn">estimated</Badge> : null}
                    {leak.productName ? <Badge tone="accent">{leak.productName}</Badge> : null}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">{leak.title}</h3>
                  <p className="mt-1 text-sm text-subtle">{leak.description}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-danger-soft px-3 py-2 text-right">
                  <p className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wide text-danger">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    Monthly impact
                  </p>
                  <p className="font-display text-xl font-semibold text-danger">
                    {formatMoney(leak.monthlyImpact, currency, true)}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-accent-soft/70 px-3 py-2 text-sm text-ink">
                <span className="font-semibold text-accent">Action: </span>
                {leak.recommendation}
              </p>
              <MathsDisclosure lines={leak.maths} />
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
