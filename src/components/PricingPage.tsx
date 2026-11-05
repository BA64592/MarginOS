import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { PRODUCT_NAME } from '../lib/brand'
import {
  FOUNDING_CAP,
  PLANS,
  PLAN_ORDER,
  TRIAL_DAYS,
  formatGbp,
  type BillingInterval,
  type PlanId,
} from '../lib/plans'
import { Button } from './ui'

const COMPARISON: { label: string; values: Record<PlanId, string> }[] = [
  {
    label: 'Unique orders / billing month',
    values: {
      starter: '500',
      growth: '2,000',
      pro: '5,000',
      scale: '15,000',
    },
  },
  {
    label: 'Platforms',
    values: {
      starter: '1 of 4',
      growth: 'Up to 2 of 4',
      pro: 'All 4',
      scale: 'All 4',
    },
  },
  {
    label: 'Shops',
    values: { starter: '1', growth: '1', pro: '1', scale: 'Up to 3' },
  },
  {
    label: 'History',
    values: {
      starter: '3 months',
      growth: '12 months',
      pro: '24 months',
      scale: 'All history, fair use',
    },
  },
  {
    label: 'Seats',
    values: { starter: '1', growth: '1', pro: '2', scale: '5' },
  },
  {
    label: 'Overheads / own FX / channel ROAS',
    values: { starter: '—', growth: 'Yes', pro: 'Yes', scale: 'Yes' },
  },
  {
    label: 'Tax',
    values: {
      starter: 'Simple UK/VAT',
      growth: 'Full per-order',
      pro: 'Full',
      scale: 'Full',
    },
  },
  {
    label: 'Scenarios',
    values: {
      starter: '—',
      growth: '2 saved',
      pro: 'Unlimited',
      scale: 'Unlimited',
    },
  },
  {
    label: 'PDF beside results',
    values: { starter: '—', growth: 'Yes', pro: 'Yes', scale: 'Yes' },
  },
  {
    label: 'Support target',
    values: {
      starter: '2 working days',
      growth: '1 working day',
      pro: 'Priority',
      scale: 'Priority + onboarding',
    },
  },
]

const FAQ = [
  {
    q: 'How does the free trial work?',
    a: `Every plan includes a ${TRIAL_DAYS}-day free trial. Card required. Cancel in Plan & billing before the displayed trial end to pay nothing. Unless cancelled, the selected monthly or annual price is charged automatically on day 15.`,
  },
  {
    q: 'How do order limits work?',
    a: 'Orders count once per billing month — re-uploading the same orders does not use allowance again. We warn at 80% and name the next plan. If a file would take you over, we import nothing and show the overage so you can upgrade and re-upload.',
  },
  {
    q: 'What happens on annual plans?',
    a: 'Pay for 10 months and receive 12. Order usage still resets monthly inside the annual period. Renewal date and terms are shown before checkout.',
  },
  {
    q: 'What is the founding offer?',
    a: `The first ${FOUNDING_CAP} successfully paying accounts get 25% off monthly for 12 months. Trial conversion counts only when the first payment succeeds. Recommended default: monthly plans only.`,
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel through Plan & billing / Stripe portal. Paid access continues to the paid-period end; trial cancel avoids the charge. Product data is deleted on the disclosed date after access ends — download your data first.',
  },
]

export function PricingPage() {
  const { setUpgradeOpen, setRoute, setAuthOpen, foundingSold } = useApp()
  const [interval, setInterval] = useState<BillingInterval>('month')
  const foundingLeft = Math.max(0, FOUNDING_CAP - foundingSold)
  const founding = interval === 'month' && foundingLeft > 0

  const chargeHint = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + TRIAL_DAYS)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [])

  return (
    <main>
      <section
        className="border-b border-border px-4 py-14 sm:px-6 sm:py-16"
        style={{
          background:
            'radial-gradient(90% 60% at 0% 0%, #e7f7f6 0%, transparent 55%), #f5f7fb',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Pricing</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-marketing)] text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            {PRODUCT_NAME} plans — {TRIAL_DAYS} days free on every tier
          </h1>
          <p className="mt-4 max-w-2xl text-base text-subtle sm:text-lg">
            Card required. Cancel before the trial ends to pay nothing. All prices include VAT. First charge
            date for a trial starting today: <span className="font-semibold text-ink">{chargeHint}</span>.
          </p>

          <div className="mt-8 inline-flex rounded-[10px] bg-muted p-1">
            {(['month', 'year'] as BillingInterval[]).map((iv) => (
              <button
                key={iv}
                type="button"
                onClick={() => setInterval(iv)}
                className={`min-h-11 rounded-[8px] px-4 text-sm font-semibold transition ${
                  interval === iv ? 'bg-elevated text-navy shadow-sm' : 'text-subtle hover:text-ink'
                }`}
              >
                {iv === 'month' ? 'Monthly' : 'Annual · 10 months for 12'}
              </button>
            ))}
          </div>

          {founding ? (
            <p className="mt-4 text-sm font-medium text-accent">
              Founding: first {FOUNDING_CAP} paying accounts — 25% off monthly for 12 months ({foundingLeft}{' '}
              places left).
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const def = PLANS[id]
            const price =
              interval === 'year'
                ? def.annualGbp
                : founding
                  ? def.foundingMonthlyGbp
                  : def.monthlyGbp
            return (
              <div
                key={id}
                className={`flex flex-col border bg-elevated p-5 ${
                  def.mostPopular ? 'border-accent ring-1 ring-accent/30' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-navy">{def.name}</h2>
                  {def.mostPopular ? (
                    <span className="rounded-[6px] bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Most popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-navy">
                  {formatGbp(price)}
                  <span className="text-sm font-medium text-subtle">
                    {interval === 'year' ? '/year' : '/month'}
                  </span>
                </p>
                <p className="mt-2 text-xs text-subtle">
                  {TRIAL_DAYS}-day free trial · then {formatGbp(price)}
                  {interval === 'year' ? '/year' : '/month'} including VAT · cancel in Plan &amp; billing
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-ink">
                  <li>{def.orderLimit.toLocaleString('en-GB')} unique orders / month</li>
                  <li>
                    {def.maxPlatforms} of 4 platforms · {def.shops} shop{def.shops > 1 ? 's' : ''}
                  </li>
                  <li>
                    History:{' '}
                    {def.historyMonths == null ? 'All history, fair use' : `${def.historyMonths} months`}
                  </li>
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={def.mostPopular ? 'primary' : 'secondary'}
                  onClick={() => setUpgradeOpen(true)}
                >
                  Start {TRIAL_DAYS}-day trial
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="border-y border-border bg-elevated px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-x-auto">
          <h2 className="font-[family-name:var(--font-marketing)] text-3xl font-semibold text-navy">
            Full comparison
          </h2>
          <p className="mt-2 text-sm text-subtle">Every plan includes true profit, Health Score, six leaks with £ impact, calculators and TikTok Shop UK — Beta.</p>
          <table className="mt-8 w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-semibold text-subtle">Capability</th>
                {PLAN_ORDER.map((id) => (
                  <th key={id} className="px-3 py-3 font-semibold text-navy">
                    {PLANS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border/70">
                  <td className="py-3 pr-4 text-subtle">{row.label}</td>
                  {PLAN_ORDER.map((id) => (
                    <td key={id} className="px-3 py-3 text-ink">
                      {row.values[id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="font-[family-name:var(--font-marketing)] text-3xl font-semibold text-navy">
          Hard limits &amp; billing FAQ
        </h2>
        <div className="mt-8 space-y-0">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-t border-border py-4">
              <summary className="cursor-pointer list-none font-semibold text-navy outline-none marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-subtle">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={() => setUpgradeOpen(true)}>Start free trial</Button>
          <Button variant="secondary" onClick={() => setRoute('sample')}>
            View sample report
          </Button>
          <Button variant="ghost" onClick={() => setAuthOpen(true)}>
            Sign in
          </Button>
        </div>
      </section>
    </main>
  )
}
