import { useApp } from '../../context/AppContext'
import { PRODUCT_NAME } from '../../lib/brand'
import { TRIAL_DAYS } from '../../lib/plans'
import { Button } from '../ui'

const LEAKS = [
  {
    rank: 1,
    title: 'Loss-making product',
    desc: 'SKU “Ceramic Mug — Sage” loses money after fees, shipping and returns.',
    impact: '−£840 / month',
    fix: 'Raise price 8% or cut packaging cost £0.40.',
  },
  {
    rank: 2,
    title: 'Unprofitable ads',
    desc: 'Meta spend on “Summer bestsellers” sits below break-even ROAS.',
    impact: '−£520 / month',
    fix: 'Pause two ad sets and reallocate to products above 18% contribution.',
  },
  {
    rank: 3,
    title: 'Fee drag',
    desc: 'Marketplace fees run 2.1pp above the comparable category preset.',
    impact: '−£310 / month',
    fix: 'Review Amazon referral categories and bundle low-margin SKUs.',
  },
]

export function SampleReportPage() {
  const { setRoute, setUpgradeOpen, loadSample } = useApp()

  return (
    <main>
      <section
        className="border-b border-border px-4 py-14 sm:px-6 sm:py-16"
        style={{
          background:
            'linear-gradient(180deg, #e7f7f6 0%, #f5f7fb 55%, #f5f7fb 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sample report</p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-marketing)] text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            What a {PRODUCT_NAME} diagnosis looks like
          </h1>
          <p className="mt-4 max-w-xl text-base text-subtle sm:text-lg">
            Synthetic sample data — labelled and never counted toward order limits. Explore the ranked
            leaks, then open the live sample shop or start a {TRIAL_DAYS}-day trial.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                loadSample()
                setRoute('app')
              }}
            >
              Open sample shop
            </Button>
            <Button variant="secondary" onClick={() => setUpgradeOpen(true)}>
              Start {TRIAL_DAYS}-day free trial
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">First dashboard</p>
            <h2 className="mt-2 font-[family-name:var(--font-marketing)] text-3xl font-semibold text-navy">
              Highest-£ fix first
            </h2>
            <p className="mt-3 text-subtle">
              Subscribers land on the top ranked fix and the three largest monthly leaks — not a wall of
              charts.
            </p>
            <ol className="mt-8 space-y-0">
              {LEAKS.map((leak) => (
                <li
                  key={leak.rank}
                  className="grid grid-cols-[auto_1fr_auto] gap-4 border-t border-border py-5 first:border-t-0"
                >
                  <span className="font-display text-2xl font-bold text-accent">#{leak.rank}</span>
                  <div>
                    <p className="font-semibold text-navy">{leak.title}</p>
                    <p className="mt-1 text-sm text-subtle">{leak.desc}</p>
                    <p className="mt-2 text-sm text-ink">
                      <span className="font-semibold text-accent">Action: </span>
                      {leak.fix}
                    </p>
                  </div>
                  <p className="text-right font-display text-lg font-semibold tabular-nums text-danger">
                    {leak.impact}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="border border-border bg-elevated p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Period snapshot</p>
            <dl className="mt-5 space-y-4">
              {[
                ['True profit', '£2,691.85'],
                ['Net margin', '12.4%'],
                ['Health Score', '36 · At risk'],
                ['Platforms', 'Shopify + Amazon'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border/80 pb-3">
                  <dt className="text-sm text-subtle">{k}</dt>
                  <dd className="font-display text-lg font-semibold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs text-subtle">
              Sample data is labelled in-app. Upload your own CSV/XLSX after sign-in to replace it.
            </p>
            <Button className="mt-5 w-full" variant="secondary" onClick={() => setRoute('pricing')}>
              See plans
            </Button>
          </aside>
        </div>
      </section>
    </main>
  )
}
