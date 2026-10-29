import { Check } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { ALLOWED_BUYER_COUNTRIES } from '../lib/payments/provider'
import {
  formatEarlyBirdPrice,
  formatFullProPrice,
  proCheckoutButtonLabel,
  proModalHeadline,
  proUnlockPaywallCopy,
} from '../lib/pricing'
import { Button, Input, Modal } from './ui'

const PERKS = [
  'Unlimited uploads, products and saved datasets',
  'Health Score breakdown by part',
  'Every leak ranked by impact in your currency',
  'Target price for every product',
  'Scenario comparison & branded PDF',
  'Tax settings, multi-currency conversion fees, overheads',
]

export function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen, unlockProDemo, currency, earlyBirdLeft, user } = useApp()
  const [country, setCountry] = useState('GB')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <Modal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Upgrade to MarginOS Pro">
      <p className="mb-3 text-sm text-subtle">{proModalHeadline(currency, earlyBirdLeft)}</p>
      <p className="mb-3 text-sm font-medium text-ink">{proUnlockPaywallCopy(currency)}</p>
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
        <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={2} />
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
            const res = unlockProDemo(country)
            setMessage(res.message)
          }}
        >
          {proCheckoutButtonLabel(currency, earlyBirdLeft)}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setUpgradeOpen(false)}>
          Stay on Free
        </Button>
      </div>
      <p className="mt-3 text-xs text-subtle">
        14-day money-back guarantee. Sold through Link. Bank statements show LINK.COM* MARGINOS.
      </p>
    </Modal>
  )
}
