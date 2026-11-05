import { useApp } from '../../context/AppContext'
import { PRODUCT_NAME } from '../../lib/brand'
import { TRIAL_DAYS, formatGbp, PLANS } from '../../lib/plans'
import { Button } from '../ui'
import { DiagnosisPreview } from './DiagnosisPreview'

export function HomePage() {
  const { setRoute, setUpgradeOpen, setAuthOpen } = useApp()

  return (
    <div>
      {/* Hero: one composition — brand, headline, support, CTAs, full-bleed product plane */}
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-marketing)] text-3xl font-semibold tracking-tight text-navy">
            A complete profit diagnosis on every plan
          </h2>
          <p className="mt-3 text-base text-subtle">
            Upload Shopify, Amazon or Etsy CSVs — or TikTok Shop UK XLSX (Beta). See true profit, Health
            Score, six leaks with £ impact, and ranked fixes. No live store connection required.
          </p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            {
              title: 'Ranked by £ impact',
              body: 'Leaks ordered by monthly cost in your currency — with Show the maths on every figure.',
            },
            {
              title: `${TRIAL_DAYS} days free`,
              body: 'Card required. Cancel before the trial ends to pay nothing. Same features as your chosen plan.',
            },
            {
              title: 'Hard order limits',
              body: 'Orders count once per billing month. We warn at 80% and never surprise you with per-order fees.',
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-accent/40 pt-5">
              <h3 className="font-display text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-subtle">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button onClick={() => setRoute('pricing')}>Compare plans</Button>
          <Button variant="secondary" onClick={() => setAuthOpen(true)}>
            Sign in
          </Button>
        </div>
      </section>
    </div>
  )
}
