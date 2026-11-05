import { useApp } from '../../context/AppContext'
import { PRODUCT_NAME } from '../../lib/brand'
import { en } from '../../i18n/en'
import { TRIAL_DAYS, formatGbp, PLANS } from '../../lib/plans'
import { Button } from '../ui'
import {
  ChartsDashboardMock,
  LeaksDashboardMock,
  OverviewDashboardMock,
  ToolsDashboardMock,
} from './DashboardShowcase'
import { DiagnosisPreview } from './DiagnosisPreview'

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-[family-name:var(--font-marketing)] text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base text-subtle sm:text-lg">{body}</p>
    </div>
  )
}

export function HomePage() {
  const { setRoute, setUpgradeOpen, setAuthOpen } = useApp()

  return (
    <div>
      {/* Hero stays one composition — full feature tour lives below */}
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
            <h1 className="mt-4 max-w-xl font-[family-name:var(--font-marketing)] text-3xl font-semibold leading-[1.15] tracking-tight text-navy sm:text-4xl">
              Stop guessing your e-commerce unit economics.
            </h1>
            <p className="mt-4 max-w-md text-base text-subtle sm:text-lg">
              Connect your channels and fix margin leaks in under 60 seconds. {en.positioning}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => setUpgradeOpen(true)}>Start {TRIAL_DAYS}-day free trial</Button>
              <Button variant="secondary" onClick={() => setRoute('app')}>
                Open control room
              </Button>
              <Button variant="ghost" onClick={() => setRoute('sample')}>
                Sample report
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature map — every major module named before deep dives */}
      <section className="border-b border-border bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <SectionIntro
            eyebrow="Product"
            title="Everything in the diagnosis — not a partial preview"
            body="Upload once. Get true profit, Health Score, six ranked leaks, charts, calculators and scenarios in one modular dashboard."
          />
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'True profit & net margin',
                body: 'After product, packaging, shipping, ads, fees, returns and overheads — with Show the maths.',
              },
              {
                title: 'Health Score 0–100',
                body: 'Band + confidence on every shop. Paid plans unlock the full score breakdown.',
              },
              {
                title: 'Six leaks, ranked by £',
                body: 'Ads, returns, loss-makers, shipping subsidy, fee drag, thin pricing — monthly impact in your currency.',
              },
              {
                title: 'Cost & product charts',
                body: 'Allocation donut and true profit by SKU. Losses marked in red — nothing decorative.',
              },
              {
                title: 'Calculators',
                body: 'Break-even ROAS, ACOS and price, plus target-margin pricing across platforms.',
              },
              {
                title: 'Scenarios & PDF',
                body: 'Model a price or cost change, save comparisons, export a PDF beside the results.',
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-accent/30 pt-4">
                <h3 className="font-display text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard overview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <SectionIntro
            eyebrow="Dashboard"
            title="KPI summary first — then the work"
            body="Persistent sidebar, period and platform filters, and modular widgets. True profit, net margin and Health Score sit above ranked fixes so dense data stays readable."
          />
          <OverviewDashboardMock />
        </div>
      </section>

      {/* Leaks */}
      <section className="border-y border-border bg-[linear-gradient(180deg,#f5f7fb_0%,#eef6f5_48%,#f5f7fb_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <LeaksDashboardMock />
            </div>
            <div className="order-1 lg:order-2">
              <SectionIntro
                eyebrow="Leaks"
                title="Six margin leaks with monthly £ impact"
                body="Every leak is ordered by what it costs you this month. Product verdicts, confidence labels and Show the maths sit on the same figures merchants act on."
              />
              <ul className="mt-6 space-y-2 text-sm text-subtle">
                {[
                  'Unprofitable ads',
                  'High returns',
                  'Loss-making product',
                  'Shipping subsidy',
                  'Fee drag',
                  'Thin pricing',
                ].map((name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <SectionIntro
            eyebrow="Visuals"
            title="Charts built for decisions, not decoration"
            body="Minimal grids, high-contrast trend bars, and contextual tooltips. Bright accents only for losses and milestones — teal and navy do the rest."
          />
          <ChartsDashboardMock />
        </div>
      </section>

      {/* Tools */}
      <section className="border-y border-border bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <ToolsDashboardMock />
            </div>
            <div className="order-1 lg:order-2">
              <SectionIntro
                eyebrow="Tools"
                title="Calculators and scenarios in the same shell"
                body="Break-even ROAS / ACOS / price, target-margin pricing, saved scenarios on Growth+, and PDF export beside the diagnosis — not bolted onto a separate app."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionIntro
          eyebrow="Inputs"
          title="Your files. No live store connection required."
          body={en.platformsLaunchLine}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Shopify', detail: 'Orders CSV' },
            { name: 'Amazon', detail: 'Payments / orders' },
            { name: 'Etsy', detail: 'Orders + items + statement' },
            { name: 'TikTok Shop UK', detail: 'XLSX · Beta' },
          ].map((p) => (
            <div key={p.name} className="border-t-2 border-navy/20 pt-4">
              <h3 className="font-display text-lg font-semibold text-navy">{p.name}</h3>
              <p className="mt-1 text-sm text-subtle">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-sm text-subtle">
          Hard unique-order limits per plan (500 → 15,000). We warn at 80% and never surprise you with
          per-order fees. Overheads, own FX and per-channel ROAS unlock on Growth and above.
        </p>
      </section>

      {/* Offer */}
      <section className="border-t border-border bg-[linear-gradient(135deg,#061f45_0%,#0a3d38_55%,#34726b_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7FC4BA]">
                Start here
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {TRIAL_DAYS}-day free trial on every plan
              </h2>
              <p className="mt-3 max-w-xl text-base text-white/75">
                Card required. Cancel before day {TRIAL_DAYS} to pay nothing. Same features as your
                chosen plan for the full trial.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  className="bg-white text-navy hover:bg-white/90"
                  onClick={() => setUpgradeOpen(true)}
                >
                  Start free trial
                </Button>
                <Button
                  variant="secondary"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  onClick={() => setRoute('pricing')}
                >
                  Compare plans
                </Button>
                <Button
                  variant="ghost"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => setRoute('sample')}
                >
                  Sample report
                </Button>
              </div>
            </div>
            <div className="rounded-[14px] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7FC4BA]">
                Most popular
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-white">
                Growth · {formatGbp(PLANS.growth.monthlyGbp)}/mo
              </p>
              <p className="mt-2 text-sm text-white/75">
                {PLANS.growth.orderLimit.toLocaleString('en-GB')} orders · {PLANS.growth.maxPlatforms}{' '}
                platforms · scenarios &amp; PDF · hard limits, no per-order fees.
              </p>
              <Button
                className="mt-5 bg-white text-navy hover:bg-white/90"
                size="sm"
                onClick={() => setUpgradeOpen(true)}
              >
                Choose Growth
              </Button>
            </div>
          </div>
          <p className="mt-10 text-sm text-white/55">
            Already have an account?{' '}
            <button type="button" className="underline underline-offset-2" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
