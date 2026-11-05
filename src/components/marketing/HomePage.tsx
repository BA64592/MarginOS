import { useApp } from '../../context/AppContext'
import { PRODUCT_NAME } from '../../lib/brand'
import { TRIAL_DAYS, formatGbp, PLANS } from '../../lib/plans'
import { Button } from '../ui'
import { DiagnosisPreview } from './DiagnosisPreview'

export function HomePage() {
  const { setRoute, setUpgradeOpen, setAuthOpen } = useApp()

  return (
    <div>
      {/* Hero: one composition — brand, headline, support, dual CTAs, full-bleed product plane */}
      <section className="relative min-h-[100svh] overflow-hidden border-b border-border lg:min-h-[calc(100svh-4.5rem)]">
        <div className="absolute inset-0 lg:left-[46%]">
          <DiagnosisPreview className="mkt-hero-visual h-full" />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[52%] lg:block"
          style={{
            background:
              'linear-gradient(90deg, #f5f7fb 0%, #f5f7fb 72%, rgb(245 247 251 / 0%) 100%)',
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-10 pt-[48vh] sm:px-6 lg:min-h-[calc(100svh-4.5rem)] lg:justify-center lg:pb-20 lg:pt-20">
          <div className="mkt-hero-copy max-w-xl rounded-[14px] bg-bg/90 p-5 backdrop-blur-sm lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <p className="font-display text-4xl font-bold tracking-tight text-navy sm:text-5xl lg:text-6xl">
              {PRODUCT_NAME}
            </p>
            <h1 className="mt-4 max-w-lg font-[family-name:var(--font-marketing)] text-3xl font-semibold leading-[1.15] tracking-tight text-navy sm:text-4xl">
              Find where your margin leaks and what each leak costs you.
            </h1>
            <p className="mt-4 max-w-md text-base text-subtle sm:text-lg">
              Plans from {formatGbp(PLANS.starter.monthlyGbp)} a month including VAT. Cancel any time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => setUpgradeOpen(true)}>Start {TRIAL_DAYS}-day free trial</Button>
              <Button variant="secondary" onClick={() => setRoute('sample')}>
                View sample report
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature–offer grid: diagnosis / trial / Growth callout — competitor pattern without clutter */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-marketing)] text-3xl font-semibold tracking-tight text-navy">
            Offer and diagnosis, side by side
          </h2>
          <p className="mt-3 text-base text-subtle">
            Upload Shopify, Amazon or Etsy CSVs — or TikTok Shop UK XLSX (Beta). See true profit, Health
            Score, six leaks with £ impact, and ranked fixes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="border-t-2 border-accent pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Diagnosis</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-navy">Ranked by £ impact</h3>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Six margin leaks ordered by monthly cost in your currency — with Show the maths on every
              figure.
            </p>
          </div>

          <div className="border-t-2 border-navy/25 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Trial</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-navy">{TRIAL_DAYS} days free</h3>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Card required. Cancel before the trial ends to pay nothing. Same features as your chosen
              plan for the full {TRIAL_DAYS} days.
            </p>
            <Button className="mt-5" size="sm" onClick={() => setUpgradeOpen(true)}>
              Start free trial
            </Button>
          </div>

          <div className="rounded-[14px] border border-accent/40 bg-accent-soft/40 p-5 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Most popular</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-navy">
              Growth · {formatGbp(PLANS.growth.monthlyGbp)}/mo
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              {PLANS.growth.orderLimit.toLocaleString('en-GB')} orders / month · {PLANS.growth.maxPlatforms}{' '}
              platforms · hard limits, no per-order fees. We warn at 80%.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setUpgradeOpen(true)}>
                Choose Growth
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setRoute('pricing')}>
                All plans
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-border pt-10">
          <div className="max-w-md">
            <h3 className="font-display text-lg font-semibold text-navy">Prefer to look before you try?</h3>
            <p className="mt-1 text-sm text-subtle">
              Open the sample report — same diagnosis layout merchants see after upload.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setRoute('sample')}>
              Sample report
            </Button>
            <Button variant="ghost" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
