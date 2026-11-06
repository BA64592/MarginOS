import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { PRODUCT_NAME } from '../lib/brand'
import {
  PLANS,
  PLAN_ORDER,
  PRIMARY_TRIAL_CTA,
  SEAT_HELP,
  SHOP_HELP,
  TRIAL_DAYS,
  formatGbp,
  trialChargeDateLabel,
  type BillingInterval,
  type PlanId,
} from '../lib/plans'
import { Button } from './ui'
import { HelpTip } from './ui/HelpTip'

const COMPARISON: {
  label: string
  help?: string
  values: Record<PlanId, string>
}[] = [
  {
    label: 'Unique orders / billing month',
    values: { starter: '500', growth: '2,000', pro: '5,000', scale: '15,000' },
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
    help: SHOP_HELP,
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
    help: SEAT_HELP,
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
]

const FAQ = [
  {
    q: 'How does the free trial work?',
    a: `Every plan includes a ${TRIAL_DAYS}-day free trial. Starter, Growth and Pro trials include full Pro features for those ${TRIAL_DAYS} days; Scale trials include Scale. You pay nothing today. Unless you cancel in Plan & billing, we charge your chosen plan on day 15 — not the Pro price unless you chose Pro or used Keep Pro. Cancel any time before then in one click.`,
  },
  {
    q: 'How do order limits work?',
    a: 'Orders count once per billing month — re-uploading the same orders does not use allowance again. During a Starter/Growth/Pro trial the Pro 5,000-order limit applies. We warn at 80% and name the next plan. If a file would take you over, we import nothing and show the overage.',
  },
  {
    q: 'What happens on annual plans?',
    a: 'Pay for 10 months and receive 12. Order usage still resets monthly inside the annual period. Renewal date and terms are shown before checkout.',
  },
  {
    q: 'How do I cancel?',
    a: 'Cancel only in Plan & billing (Cancel trial or Cancel subscription). Only the account owner can cancel. There is no email, phone or support-ticket cancellation. You keep access until the trial or paid period ends; then the account is closed, the login is removed, and product data is permanently deleted. Download my data before then.',
  },
]

export function PricingPage() {
  const { setUpgradeOpen, setRoute, setAuthOpen } = useApp()
  const [interval, setInterval] = useState<BillingInterval>('month')

  const chargeHint = useMemo(() => trialChargeDateLabel(), [])

  return (
    <main>
      <section
        className="border-b border-border px-4 py-14 sm:px-6 sm:py-16"
        style={{
          background:
            'radial-gradient(90% 60% at 0% 0%, #e7f7f6 0%, transparent 55%), #f5f7fb',
        }}
      >
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Pricing</p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-marketing)] text-[1.75rem] font-semibold tracking-tight text-navy sm:text-4xl lg:text-5xl">
            {PRODUCT_NAME} plans — {TRIAL_DAYS} days free on every tier
          </h1>
          <p className="mt-4 max-w-2xl text-base text-subtle sm:text-lg">
            14 days free, then your chosen plan. You won’t be charged until{' '}
            <span className="font-semibold text-ink">{chargeHint}</span>. Cancel any time before then in
            one click in Plan &amp; billing. All prices include VAT. Every trial includes Pro features
            (Scale trials include Scale).
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

          <div className="mt-8 grid gap-4 rounded-[14px] border border-navy/15 bg-elevated/90 p-5 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy">Pro command centre</p>
              <p className="mt-2 font-display text-xl font-semibold text-navy">
                Pro · {formatGbp(interval === 'year' ? PLANS.pro.annualGbp : PLANS.pro.monthlyGbp)}
                {interval === 'year' ? '/year' : '/month'}
              </p>
              <p className="mt-2 text-sm text-subtle">
                5,000 unique orders · all 4 platforms · 24 months history · 2 seats · unlimited
                scenarios. Built for multi-channel merchants who live in the control room daily.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="secondary" onClick={() => setUpgradeOpen(true)}>
                Choose Pro
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document.getElementById('plan-comparison')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Full comparison
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="plan-cards" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const def = PLANS[id]
            const price = interval === 'year' ? def.annualGbp : def.monthlyGbp
            const isPro = id === 'pro'
            return (
              <div
                key={id}
                id={`plan-card-${id}`}
                tabIndex={-1}
                className={`flex flex-col border bg-elevated p-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  def.mostPopular
                    ? 'border-accent ring-1 ring-accent/30'
                    : isPro
                      ? 'border-navy/40 ring-1 ring-navy/15'
                      : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-navy">{def.name}</h2>
                  {def.mostPopular ? (
                    <span className="rounded-[6px] bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Most popular
                    </span>
                  ) : isPro ? (
                    <span className="rounded-[6px] bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Command centre
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-navy">
                  {formatGbp(price)}
                  <span className="text-sm font-medium text-subtle">
                    {interval === 'year' ? '/year' : '/month'}
                  </span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-subtle">
                  14 days free, then {formatGbp(price)} {interval === 'year' ? 'a year' : 'a month'}{' '}
                  including VAT. You won’t be charged until {chargeHint}. Cancel any time before then in
                  one click.
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
                  Choose {def.name}
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section id="plan-comparison" className="scroll-mt-28 border-y border-border bg-elevated px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-marketing)] text-[1.75rem] font-semibold text-navy sm:text-3xl">
            Full comparison
          </h2>
          <p className="mt-2 text-sm text-subtle sm:text-base">
            Every plan includes true profit, Health Score, six leaks with £ impact, calculators and
            TikTok Shop UK — Beta. Every trial includes Pro features.
          </p>
          <div className="mt-8 overflow-x-auto">
            <p className="mb-2 text-xs text-subtle lg:hidden">Swipe sideways to see all plans →</p>
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-elevated py-3 pr-4 font-semibold text-subtle">
                    Capability
                  </th>
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
                    <td className="sticky left-0 z-10 bg-elevated py-3 pr-4 text-subtle">
                      {row.help ? <HelpTip label={row.label}>{row.help}</HelpTip> : row.label}
                    </td>
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
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="font-[family-name:var(--font-marketing)] text-[1.75rem] font-semibold text-navy sm:text-3xl">
          Hard limits &amp; billing FAQ
        </h2>
        <div className="mt-8 space-y-0">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-t border-border py-4">
              <summary className="min-h-11 cursor-pointer list-none font-semibold text-navy outline-none marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-subtle sm:text-base">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={() => setUpgradeOpen(true)}>{PRIMARY_TRIAL_CTA}</Button>
          <Button variant="ghost" onClick={() => setRoute('sample')}>
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
