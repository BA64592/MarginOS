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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-xl opacity-80 sm:w-1/2"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 70% 40%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="animate-fade-up max-w-2xl">
          <p className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            MarginOS
          </p>
          <h2 className="mt-4 max-w-xl text-lg font-medium leading-snug text-ink sm:text-xl">
            Find where your margin leaks and what each leak costs you.
          </h2>
          <p className="mt-3 max-w-lg text-sm text-subtle sm:text-base">
            True profit after product cost, shipping, ads, platform fees and returns — one price, no
            subscription.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
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
          <p className="mt-8 text-sm text-subtle">
            Live catalogue ·{' '}
            <span className="font-semibold text-ink">{formatGbp(result.totals.trueProfit)}</span>{' '}
            true profit · score{' '}
            <span className="font-semibold text-ink">{result.healthScore}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
