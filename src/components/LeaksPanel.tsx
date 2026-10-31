import { ArrowDownRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatMoney } from '../lib/format'
import { proUnlockPaywallCopy } from '../lib/pricing'
import { Badge, Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'
import { MathsDisclosure } from './MathsDisclosure'

export function LeaksPanel() {
  const { result, plan, currency, earlyBirdLeft, setUpgradeOpen } = useApp()
  const freeLeaks = result.leaks.slice(0, 3)
  const visible = plan === 'pro' ? result.leaks : freeLeaks

  return (
    <section>
      <SectionHeading
        eyebrow="Margin leaks"
        title="Ranked by monthly impact"
        description={
          plan === 'pro'
            ? 'Every margin leak with monthly impact in your home currency, largest first.'
            : 'Free shows your top 3 leaks. Monthly £ impact unlocks in Pro.'
        }
      />

      {!result.leaks.length ? (
        <Card>
          <p className="text-sm text-subtle">No launch leaks triggered for this period.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((leak, index) => (
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
                {plan === 'pro' ? (
                  <div className="shrink-0 rounded-xl bg-danger-soft px-3 py-2 text-right">
                    <p className="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wide text-danger">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      Monthly impact
                    </p>
                    <p className="font-display text-xl font-semibold text-danger">
                      {formatMoney(leak.monthlyImpact, currency, true)}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUpgradeOpen(true)}
                    className="shrink-0 max-w-[14rem] rounded-xl border border-dashed border-border bg-muted/60 px-3 py-2 text-left text-xs text-subtle"
                  >
                    Impact locked
                    <span className="mt-1 block font-semibold text-accent">
                      {proUnlockPaywallCopy(currency, earlyBirdLeft)}
                    </span>
                  </button>
                )}
              </div>
              {plan === 'pro' ? (
                <>
                  <p className="mt-3 rounded-xl bg-accent-soft/70 px-3 py-2 text-sm text-ink">
                    <span className="font-semibold text-accent">Action: </span>
                    {leak.recommendation}
                  </p>
                  <MathsDisclosure lines={leak.maths} />
                </>
              ) : null}
            </Card>
          ))}

          {plan === 'free' && result.leaks.length > 3 ? (
            <ProGate compact label={`${result.leaks.length - 3} more leaks — Pro`}>
              <Card>
                <p className="text-sm text-subtle">Additional leaks hidden on Free.</p>
              </Card>
            </ProGate>
          ) : null}
        </div>
      )}
    </section>
  )
}
