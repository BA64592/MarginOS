import { Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { formatMoney } from '../lib/format'
import { hasPaidAccess } from '../lib/plans'
import { heroCta } from '../lib/pricing'
import { BrandMark } from './BrandMark'
import { ClearSampleDataButton } from './ConfirmActions'
import { Badge, Button } from './ui'

function scrollToUpload() {
  document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
  window.setTimeout(() => {
    document.getElementById('platform-upload')?.focus({ preventScroll: true })
  }, 400)
}

export function Hero() {
  const { result, setUpgradeOpen, access, currency, usingSampleData, isEmptyShop } = useApp()

  const scoreTone =
    result.health.band === 'Strong'
      ? 'text-ok'
      : result.health.band === 'Needs attention'
        ? 'text-warn'
        : result.health.band === 'At risk'
          ? 'text-danger'
          : 'text-ink'

  const subscribed = hasPaidAccess(access)

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      style={{ background: 'var(--hero-glow)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-xl opacity-90 sm:w-1/2"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 70% 40%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="animate-fade-up max-w-2xl">
          <div className="mb-5 flex items-center gap-3">
            <BrandMark size={56} />
            <p className="font-display text-5xl font-bold tracking-tight text-navy sm:text-6xl lg:text-7xl">
              {en.brand}
            </p>
          </div>
          <h2 className="mt-2 max-w-xl font-display text-xl font-semibold leading-snug text-navy sm:text-2xl">
            {en.tagline}
          </h2>
          <p className="mt-3 max-w-lg text-sm text-subtle sm:text-base">{en.positioning}</p>
          {!subscribed ? (
            <p className="mt-2 max-w-lg text-sm text-subtle">{en.trialLine}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!subscribed ? (
              <Button onClick={() => setUpgradeOpen(true)}>{heroCta()}</Button>
            ) : (
              <Button variant="secondary">Plan active</Button>
            )}
            <Button variant="secondary" onClick={scrollToUpload}>
              <Upload className="h-4 w-4" />
              Upload your orders
            </Button>
            <ClearSampleDataButton />
          </div>
          <p className="mt-4 max-w-lg text-sm text-subtle">
            {isEmptyShop
              ? 'No orders loaded yet. Upload a Shopify, Amazon, Etsy or TikTok Shop UK export.'
              : usingSampleData
                ? 'You’re viewing sample data. Upload a platform export to see your real margins.'
                : 'Upload a platform export anytime to refresh your numbers.'}{' '}
            {en.tiktokBeta}.
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-subtle">
            {usingSampleData ? <Badge tone="warn">Sample data</Badge> : null}
            {isEmptyShop ? (
              <span className="font-medium text-ink">Empty shop — upload to get started</span>
            ) : (
              <span>
                <span className="font-semibold tabular-nums text-navy">
                  {formatMoney(result.totals.trueProfit, currency)}
                </span>{' '}
                true profit · score{' '}
                <span className={`font-semibold tabular-nums ${scoreTone}`}>
                  {result.health.score ?? '—'}
                </span>
                {result.health.band ? (
                  <span className="text-subtle"> · {result.health.band}</span>
                ) : null}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
