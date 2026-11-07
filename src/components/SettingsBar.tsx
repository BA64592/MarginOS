import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { PRODUCT_NAME } from '../lib/brand'
import { hasFeature, hasPaidAccess } from '../lib/plans'
import type { HomeCurrency } from '../lib/types'
import { StartFreshButton } from './ConfirmActions'
import { Button, Card, ConfirmDialog, Input, SectionHeading } from './ui'
import { ProGate } from './ProGate'

const CURRENCIES: HomeCurrency[] = ['GBP', 'EUR', 'USD', 'CAD', 'AUD']

export function SettingsBar() {
  const {
    currency,
    setCurrency,
    tax,
    setTax,
    monthlyOverheads,
    setMonthlyOverheads,
    plan,
    access,
    exportDataCsv,
    user,
    keptProData,
    setUpgradeOpen,
    deleteAccount,
    setAuthOpen,
  } = useApp()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const [overheadsText, setOverheadsText] = useState(() =>
    monthlyOverheads === 0 ? '' : String(monthlyOverheads),
  )

  useEffect(() => {
    setOverheadsText((prev) => {
      const parsed = prev.trim() === '' ? 0 : Number(prev)
      if (Number.isFinite(parsed) && parsed === monthlyOverheads) return prev
      return monthlyOverheads === 0 ? '' : String(monthlyOverheads)
    })
  }, [monthlyOverheads])

  const downloadCsv = () => {
    const blob = new Blob([exportDataCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'margins365-data-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Settings"
        title="Profile, plan and data"
        description="Three areas: profile & sign-in, plan & billing (via plans modal), and data & privacy. FX uses ECB reference rates."
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-subtle">
              Home currency
            </span>
            <select
              className="h-10 w-full rounded-lg border border-border bg-elevated px-3"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as HomeCurrency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={tax.pricesIncludeTax}
              onChange={(e) => setTax({ pricesIncludeTax: e.target.checked })}
            />
            <span>Prices include VAT / sales tax / GST</span>
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
              onClick={downloadCsv}
            >
              Download my data (CSV)
            </button>
            <p className="mt-1 text-xs text-subtle">
              Cleaned order rows and costs only — never the original upload file.
            </p>
          </div>
        </div>
      </Card>

      {hasFeature(plan, 'fullTax') || hasFeature(plan, 'overheads') ? (
        <Card className="mt-4">
          <p className="mb-3 text-sm font-semibold text-ink">Tax settings (estimates, not tax advice)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-subtle">Business country</span>
              <Input
                value={tax.businessCountry}
                onChange={(e) => setTax({ businessCountry: e.target.value.toUpperCase() })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={tax.vatGstRegistered}
                onChange={(e) => setTax({ vatGstRegistered: e.target.checked })}
              />
              VAT/GST registered
            </label>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={tax.euOss}
                onChange={(e) => setTax({ euOss: e.target.checked })}
              />
              EU OSS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tax.euIoss}
                onChange={(e) => setTax({ euIoss: e.target.checked })}
              />
              EU IOSS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tax.ukFlatRate}
                onChange={(e) => setTax({ ukFlatRate: e.target.checked })}
              />
              UK Flat Rate
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-subtle">Monthly overheads</span>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="0"
                value={overheadsText}
                onChange={(e) => {
                  const raw = e.target.value
                  setOverheadsText(raw)
                  if (raw.trim() === '') {
                    setMonthlyOverheads(0)
                    return
                  }
                  const n = Number(raw)
                  if (Number.isFinite(n)) setMonthlyOverheads(n)
                }}
              />
            </label>
          </div>
        </Card>
      ) : (
        <div className="mt-4">
          <ProGate label="Tax & overheads — Growth+" feature="overheads">
            <Card>
              <p className="text-sm text-subtle">Business country, OSS/IOSS, Flat Rate, US states, overheads.</p>
            </Card>
          </ProGate>
        </div>
      )}

      <Card className="mt-4">
        <p className="mb-1 text-sm font-semibold text-ink">Plan &amp; billing</p>
        <p className="mb-3 text-sm text-subtle">
          {hasPaidAccess(access)
            ? 'Manage trial, subscription, invoices and cancellation in Stripe customer portal (wired at live Stripe).'
            : 'Start a 14-day free trial on any plan. Cancel before day 14 and pay nothing in Plan & billing — one click. Cancelling also closes the account when access ends.'}
        </p>
        <Button size="sm" onClick={() => setUpgradeOpen(true)}>
          {hasPaidAccess(access) ? 'Change plan' : 'View plans & start trial'}
        </Button>
      </Card>

      <Card className="mt-4">
        <p className="mb-1 text-sm font-semibold text-ink">Start fresh</p>
        <p className="mb-3 text-sm text-subtle">
          Delete all orders, costs, ads, overheads, scenarios and saved datasets from this shop
          {keptProData ? ', including any kept legacy data' : ''}. Your account and sign-in stay.
          Subscription cancellation is separate and schedules product-data deletion at access end.
        </p>
        <StartFreshButton />
      </Card>

      <Card className="mt-4 border-dashed">
        <p className="mb-1 text-sm font-semibold text-ink">Close account</p>
        <p className="mb-3 text-sm text-subtle">
          Account closure is a verified email request completed within 7 days and removes login too
          (separate from cancelling a subscription). For this browser demo you can still wipe the local
          {PRODUCT_NAME} session below.
          {user ? ` Signed in as ${user.email}.` : ' Sign in first.'}
        </p>
        {user ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Wipe local account session
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAuthOpen(true)}>
            {user ? 'Account' : 'Sign in'}
          </Button>
        )}
        {deleteMsg ? <p className="mt-2 text-xs text-subtle">{deleteMsg}</p> : null}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        confirmLabel="Delete account"
        danger
        onCancel={() => {
          setConfirmOpen(false)
          setConfirmEmail('')
        }}
        onConfirm={() => {
          const res = deleteAccount(confirmEmail)
          setDeleteMsg(res.message)
          if (res.ok) {
            setConfirmOpen(false)
            setConfirmEmail('')
          }
        }}
      >
        <p>This cannot be undone in this browser. Type your email to confirm.</p>
        <Input
          type="email"
          placeholder={user?.email}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
        />
      </ConfirmDialog>
    </section>
  )
}
