import { useState } from 'react'
import { useApp } from '../context/AppContext'
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

  const downloadCsv = () => {
    const blob = new Blob([exportDataCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'marginos-data-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Settings"
        title="Currency & tax"
        description="Home currency for Free and Pro. Full tax settings screen is Pro. FX uses ECB reference rates."
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

      {plan === 'pro' ? (
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
                value={monthlyOverheads}
                onChange={(e) => setMonthlyOverheads(Number(e.target.value))}
              />
            </label>
          </div>
        </Card>
      ) : (
        <div className="mt-4">
          <ProGate label="Tax settings & overheads — Pro">
            <Card>
              <p className="text-sm text-subtle">Business country, OSS/IOSS, Flat Rate, US states, overheads.</p>
            </Card>
          </ProGate>
        </div>
      )}

      {keptProData && plan === 'free' ? (
        <Card className="mt-4 border-accent/30 bg-accent-soft/30">
          <p className="mb-1 text-sm font-semibold text-ink">Previous Pro data kept (export only)</p>
          <p className="mb-3 text-sm text-subtle">
            After a refund or chargeback your Pro shop is held until you Start fresh or delete the
            account. It does not appear in results while you&apos;re on Free. Re-activate Pro to
            restore it unchanged.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
              onClick={downloadCsv}
            >
              Download kept data (CSV)
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
              onClick={() => setUpgradeOpen(true)}
            >
              Restore with Pro
            </button>
          </div>
        </Card>
      ) : null}

      <Card className="mt-4">
        <p className="mb-1 text-sm font-semibold text-ink">Start fresh</p>
        <p className="mb-3 text-sm text-subtle">
          Delete all orders, costs, ads, overheads, scenarios and saved datasets from this shop
          {keptProData ? ', including any kept ex-Pro data' : ''}. Your account, sign-in
          {plan === 'pro' ? ', Pro licence' : ''} and settings stay. This is not account deletion.
        </p>
        <StartFreshButton />
      </Card>

      <Card className="mt-4 border-dashed">
        <p className="mb-1 text-sm font-semibold text-ink">Delete account</p>
        <p className="mb-3 text-sm text-subtle">
          Permanently deletes your MarginOS account on this device, including Pro access, orders,
          costs and kept ex-Pro data. Type your email to confirm.
          {user ? ` Signed in as ${user.email}.` : ' Sign in first.'}
        </p>
        {user ? (
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            Delete account
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAuthOpen(true)}>
            Sign in to delete account
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
