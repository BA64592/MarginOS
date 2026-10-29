import { useApp } from '../context/AppContext'
import type { HomeCurrency } from '../lib/types'
import { StartFreshButton } from './ConfirmActions'
import { Card, Input, SectionHeading } from './ui'
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
  } = useApp()

  return (
    <section>
      <SectionHeading
        eyebrow="Settings"
        title="Currency & tax"
        description="Home currency for Free and Pro. Full tax settings screen is Pro."
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
              onClick={() => {
                const blob = new Blob([exportDataCsv()], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'marginos-data-export.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download my data (CSV)
            </button>
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
              UK Flat Rate Scheme
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-subtle">Monthly overheads</span>
              <Input
                type="number"
                min={0}
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

      <Card className="mt-4">
        <p className="mb-1 text-sm font-semibold text-ink">Start fresh</p>
        <p className="mb-3 text-sm text-subtle">
          Delete all orders, costs, ads, overheads, scenarios and saved datasets from this shop.
          Your account, sign-in{plan === 'pro' ? ', Pro licence' : ''} and settings stay. This is not
          account deletion.
        </p>
        <StartFreshButton />
      </Card>

      <Card className="mt-4 border-dashed">
        <p className="mb-1 text-sm font-semibold text-ink">Delete account</p>
        <p className="text-sm text-subtle">
          Permanently deleting your account is separate from Start fresh. It removes the account
          itself (and Pro access) under the account-deletion rules — not available in this demo
          build.
          {user ? ` Signed in as ${user.email}.` : ' Sign in first when this ships.'}
        </p>
      </Card>
    </section>
  )
}
