import { useApp } from '../context/AppContext'
import { formatGbp } from '../lib/format'
import { Button } from './ui'

export function Hero() {
  const { result, setUpgradeOpen, plan } = useApp()

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: 'var(--hero-glow)' }}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="animate-fade-up">
          <p className="mb-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            MarginOS
          </p>
          <h2 className="max-w-xl text-xl font-medium leading-snug text-ink sm:text-2xl">
            Find where your margin leaks and what each leak costs you.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-subtle sm:text-base">
            True profit after product cost, shipping, ads, platform fees and returns — with a Health
            Score and ranked fixes. One price, no subscription.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {plan === 'free' ? (
              <Button onClick={() => setUpgradeOpen(true)}>Get Pro · £19 lifetime</Button>
            ) : (
              <Button variant="secondary">Pro unlocked</Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Open calculator
            </Button>
          </div>
        </div>

        <div
          className="animate-fade-up relative overflow-hidden rounded-3xl border border-border bg-elevated/90 p-5 sm:p-6"
          style={{ boxShadow: 'var(--shadow)', animationDelay: '80ms' }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-70"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--accent) 35%, transparent), transparent 70%)',
            }}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Live preview</p>
          <p className="mt-3 font-display text-4xl font-semibold text-ink">
            {formatGbp(result.totals.trueProfit)}
          </p>
          <p className="mt-1 text-sm text-subtle">True profit this month across your catalogue</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-xs text-subtle">Health score</p>
              <p className="font-display text-2xl font-semibold text-ink">{result.healthScore}</p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-3">
              <p className="text-xs text-subtle">Top leak</p>
              <p className="truncate font-display text-lg font-semibold text-ink">
                {result.leaks[0]?.title ?? 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
