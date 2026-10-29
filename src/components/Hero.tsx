import { Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { formatMoney } from '../lib/format'
import { proHeroCta } from '../lib/pricing'
import { ClearSampleDataButton } from './ConfirmActions'
import { Badge, Button } from './ui'

function scrollToUpload() {
  document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
  window.setTimeout(() => {
    document.getElementById('platform-upload')?.focus({ preventScroll: true })
  }, 400)
}

export function Hero() {
  const {
    result,
    setUpgradeOpen,
    plan,
    currency,
    earlyBirdLeft,
    usingSampleData,
    isEmptyShop,
  } = useApp()

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
            {en.brand}
          </p>
          <h2 className="mt-4 max-w-xl text-lg font-medium leading-snug text-ink sm:text-xl">
            {en.tagline}
          </h2>
          <p className="mt-3 max-w-lg text-sm text-subtle sm:text-base">
            True profit after product cost, shipping, ads, platform fees and returns —{' '}
            {en.positioning.toLowerCase()}
          </p>
          {plan === 'free' ? (
            <p className="mt-2 max-w-lg text-sm text-subtle">{en.freeTryLine}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {plan === 'free' ? (
              <Button onClick={() => setUpgradeOpen(true)}>
                {proHeroCta(currency, earlyBirdLeft)}
              </Button>
            ) : (
              <Button variant="secondary">Pro unlocked</Button>
            )}
            <Button variant="secondary" onClick={scrollToUpload}>
              <Upload className="h-4 w-4" />
              Upload your orders
            </Button>
            <ClearSampleDataButton />
          </div>
          <p className="mt-4 max-w-lg text-sm text-subtle">
            {isEmptyShop
              ? 'No orders loaded yet. Upload a Shopify, Amazon or Etsy export to see true profit and leaks.'
              : usingSampleData
                ? 'You’re viewing sample data. Upload a Shopify, Amazon or Etsy export to see your real margins.'
                : 'Upload a Shopify, Amazon or Etsy export anytime to refresh your numbers.'}
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-subtle">
            {usingSampleData ? <Badge tone="warn">Sample data</Badge> : null}
            {isEmptyShop ? (
              <span className="font-medium text-ink">Empty shop — upload to get started</span>
            ) : (
              <span>
                <span className="font-semibold text-ink">
                  {formatMoney(result.totals.trueProfit, currency)}
                </span>{' '}
                true profit · score{' '}
                <span className="font-semibold text-ink">{result.health.score ?? '—'}</span>
                {earlyBirdLeft > 0 && plan === 'free' ? (
                  <span className="ml-2 text-accent">· {earlyBirdLeft} early-bird places left</span>
                ) : null}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
