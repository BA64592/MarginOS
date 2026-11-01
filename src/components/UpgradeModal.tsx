import { Check } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { isDemoHarnessEnabled } from '../lib/demoFlags'
import { ALLOWED_BUYER_COUNTRIES } from '../lib/payments/provider'
import {
  formatEarlyBirdPrice,
  formatFullProPrice,
  proCheckoutButtonLabel,
  proModalHeadline,
  proUnlockPaywallCopy,
} from '../lib/pricing'
import { Button, Modal } from './ui'

const BUYER_COUNTRY_LABELS: Record<string, string> = {
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  IE: 'Ireland',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  BE: 'Belgium',
  AT: 'Austria',
  PT: 'Portugal',
  SE: 'Sweden',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  NZ: 'New Zealand',
  CH: 'Switzerland',
  NO: 'Norway',
}

const BUYER_COUNTRY_OPTIONS = [...ALLOWED_BUYER_COUNTRIES].sort((a, b) =>
  (BUYER_COUNTRY_LABELS[a] ?? a).localeCompare(BUYER_COUNTRY_LABELS[b] ?? b),
)

const PERKS = [
  'Keep your data, saved datasets and history',
  'Unlimited uploads (fair use), products and saved datasets',
  'Health Score breakdown by part',
  'Every leak ranked by impact in your currency',
  'Target price for every product',
  'Scenario comparison & branded PDF',
  'Tax settings, multi-currency conversion fees, overheads',
]

export function UpgradeModal() {
  const {
    upgradeOpen,
    setUpgradeOpen,
    unlockProDemo,
    currency,
    earlyBirdLeft,
    user,
    plan,
    paymentPending,
    setPaymentPending,
    failDelayedPayment,
  } = useApp()
  const [country, setCountry] = useState('GB')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <Modal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Upgrade to MarginOS Pro">
      <p className="mb-3 text-sm text-subtle">{proModalHeadline(currency, earlyBirdLeft)}</p>
      <p className="mb-3 text-sm font-medium text-ink">
        {proUnlockPaywallCopy(currency, earlyBirdLeft)}
      </p>
      {earlyBirdLeft > 0 ? (
        <p className="mb-3 text-sm font-medium text-accent">
          {earlyBirdLeft} early-bird places left (first 200 sales). After that,{' '}
          {formatFullProPrice(currency)}.
        </p>
      ) : (
        <p className="mb-3 text-sm text-subtle">
          Early-bird offers have ended. Full price is {formatFullProPrice(currency)} (was{' '}
          {formatEarlyBirdPrice(currency)} early-bird).
        </p>
      )}
      <ul className="mb-4 space-y-2">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {p}
          </li>
        ))}
      </ul>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
          Billing country
        </span>
        <select
          className="min-h-11 w-full rounded-[10px] border border-border bg-elevated px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--ring)]"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {BUYER_COUNTRY_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {BUYER_COUNTRY_LABELS[code] ?? code}
            </option>
          ))}
        </select>
        {!ALLOWED_BUYER_COUNTRIES.has(country.toUpperCase()) ? (
          <span className="mt-1 block text-xs text-danger">{en.countryBlocked}</span>
        ) : null}
      </label>
      {message ? <p className="mb-3 text-sm text-subtle">{message}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          onClick={() => {
            if (!user) {
              setMessage('Sign in with a verified email first.')
              return
            }
            void unlockProDemo(country).then((res) => setMessage(res.message))
          }}
        >
          {proCheckoutButtonLabel(currency, earlyBirdLeft)}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setUpgradeOpen(false)}>
          Stay on Free
        </Button>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Free uploads are deleted after 24 hours, and original files are deleted as soon as they&apos;re
        imported. Upgrading within 24 hours keeps your Free data in Pro.
      </p>
      <p className="mt-2 text-xs text-subtle">14-day money-back guarantee.</p>
      {plan === 'free' && isDemoHarnessEnabled() ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-3 py-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
            Demo · delayed payment (K11)
          </p>
          <p className="mb-2 text-xs text-subtle">
            Pending pauses Free 24h clocks. Fail deletes data whose clock would already have ended.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={paymentPending}
              onClick={() => {
                setPaymentPending(true)
                setMessage(en.paymentProcessing)
              }}
            >
              Mark payment pending
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!paymentPending}
              onClick={() => {
                const res = failDelayedPayment()
                setMessage(res.message)
              }}
            >
              Simulate payment failed
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
