import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PRODUCT_NAME } from '../lib/brand'
import { PLANS, PLAN_ORDER, TRIAL_DAYS, formatGbp } from '../lib/plans'
import { Button, SectionHeading } from './ui'

export function PricingPage() {
  const { setUpgradeOpen, setRoute, setAuthOpen } = useApp()

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow="Pricing"
        title={`${PRODUCT_NAME} plans`}
        description={`${TRIAL_DAYS}-day free trial on every tier. Card required. Cancel before the trial ends to pay nothing. Annual = 10 months for 12.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const def = PLANS[id]
          return (
            <div
              key={id}
              className={`rounded-2xl border bg-elevated p-5 ${
                def.mostPopular ? 'border-accent shadow-sm' : 'border-border'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-ink">{def.name}</h3>
                {def.mostPopular ? (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="font-display text-3xl font-bold text-navy">
                {formatGbp(def.monthlyGbp)}
                <span className="text-sm font-medium text-subtle">/mo</span>
              </p>
              <p className="mt-1 text-sm text-subtle">
                or {formatGbp(def.annualGbp)}/year · founding monthly {formatGbp(def.foundingMonthlyGbp)}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {def.orderLimit.toLocaleString('en-GB')} unique orders / month
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {def.maxPlatforms} of 4 platforms · {def.shops} shop{def.shops > 1 ? 's' : ''}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  History:{' '}
                  {def.historyMonths == null ? 'All history, fair use' : `${def.historyMonths} months`}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  Support: {def.supportTarget}
                </li>
              </ul>
              <Button
                className="mt-5 w-full"
                onClick={() => {
                  setRoute('app')
                  setUpgradeOpen(true)
                }}
              >
                Start {TRIAL_DAYS}-day trial
              </Button>
            </div>
          )
        })}
      </div>
      <p className="mt-8 text-sm text-subtle">
        Orders count once per billing month. We warn at 80% and block whole uploads over the limit —
        upgrade and re-upload. Existing results remain while your trial or subscription is active.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setRoute('app')}>
          Back to app
        </Button>
        <Button variant="ghost" onClick={() => setAuthOpen(true)}>
          Sign in
        </Button>
      </div>
    </main>
  )
}
