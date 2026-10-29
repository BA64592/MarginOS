import { Plus, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { FREE_PRODUCT_LIMIT } from '../lib/calc'
import { SAMPLE_CSV } from '../lib/csv'
import { formatGbp } from '../lib/format'
import { cn } from '../lib/cn'
import { SliderField } from './SliderField'
import { Badge, Button, Card, Input, SectionHeading } from './ui'

export function ProductWorkspace() {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    updateProduct,
    addProduct,
    removeProduct,
    importCsv,
    resetSample,
    plan,
    canAddProduct,
    canUploadCsv,
    setUpgradeOpen,
    result,
  } = useApp()
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const selected = products.find((p) => p.id === selectedProductId) ?? products[0]
  const selectedMetrics = result.products.find((p) => p.product.id === selected?.id)

  const onFile = async (file: File) => {
    const text = await file.text()
    const res = importCsv(text)
    setCsvError(res.ok ? null : res.error ?? 'Import failed')
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Inputs"
        title="Products & costs"
        description="Enter units, price and every cost that hits margin. Updates calculate instantly."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={resetSample}>
              Load sample
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (!canUploadCsv) {
                  setUpgradeOpen(true)
                  return
                }
                fileRef.current?.click()
              }}
            >
              <Upload className="h-4 w-4" />
              CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!canAddProduct) setUpgradeOpen(true)
                else addProduct()
              }}
            >
              <Plus className="h-4 w-4" />
              Add product
            </Button>
          </div>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onFile(file)
          e.target.value = ''
        }}
      />

      {csvError ? (
        <p className="mb-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          {csvError}
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-subtle">
        <Badge tone={plan === 'free' ? 'warn' : 'ok'}>
          {products.length}
          {plan === 'free' ? ` / ${FREE_PRODUCT_LIMIT}` : ''} products
        </Badge>
        <span>
          CSV columns: name, units_sold, selling_price, product_cost, shipping_cost, ad_spend,
          platform_fee_pct, return_rate_pct
        </span>
        <button
          type="button"
          className="font-medium text-accent underline-offset-2 hover:underline"
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'marginos-sample.csv'
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Download sample CSV
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[520px] overflow-auto p-2 sm:p-3">
          <ul className="space-y-1">
            {products.map((product) => {
              const m = result.products.find((row) => row.product.id === product.id)
              const active = product.id === selected?.id
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition',
                      active ? 'bg-accent-soft text-ink' : 'hover:bg-muted',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{product.name}</span>
                      <span className="block text-xs text-subtle">
                        {product.unitsSold} units · {formatGbp(m?.trueProfit ?? 0)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-semibold tabular-nums',
                        (m?.marginPct ?? 0) >= 20
                          ? 'text-ok'
                          : (m?.marginPct ?? 0) >= 8
                            ? 'text-warn'
                            : 'text-danger',
                      )}
                    >
                      {(m?.marginPct ?? 0).toFixed(0)}%
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        {selected ? (
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-subtle">
                  Product name
                </label>
                <Input
                  value={selected.name}
                  onChange={(e) => updateProduct(selected.id, { name: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-end text-danger hover:bg-danger-soft"
                onClick={() => removeProduct(selected.id)}
                disabled={products.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>

            {selectedMetrics ? (
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['True profit', formatGbp(selectedMetrics.trueProfit)],
                  ['Margin', `${selectedMetrics.marginPct.toFixed(1)}%`],
                  ['Gross', formatGbp(selectedMetrics.grossRevenue)],
                  ['Refunds', formatGbp(selectedMetrics.refunds)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-muted/80 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
                    <p className="font-display text-lg font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <SliderField
                label="Units sold / month"
                value={selected.unitsSold}
                min={0}
                max={2000}
                step={1}
                onChange={(unitsSold) => updateProduct(selected.id, { unitsSold })}
              />
              <SliderField
                label="Selling price"
                value={selected.sellingPrice}
                min={1}
                max={300}
                step={0.5}
                suffix="£"
                onChange={(sellingPrice) => updateProduct(selected.id, { sellingPrice })}
              />
              <SliderField
                label="Product cost (COGS)"
                value={selected.productCost}
                min={0}
                max={200}
                step={0.5}
                suffix="£"
                onChange={(productCost) => updateProduct(selected.id, { productCost })}
              />
              <SliderField
                label="Shipping / unit"
                value={selected.shippingCost}
                min={0}
                max={40}
                step={0.1}
                suffix="£"
                onChange={(shippingCost) => updateProduct(selected.id, { shippingCost })}
              />
              <SliderField
                label="Ad spend / month"
                value={selected.adSpend}
                min={0}
                max={10000}
                step={10}
                suffix="£"
                onChange={(adSpend) => updateProduct(selected.id, { adSpend })}
              />
              <SliderField
                label="Platform fee"
                value={selected.platformFeePct}
                min={0}
                max={30}
                step={0.5}
                suffix="%"
                onChange={(platformFeePct) => updateProduct(selected.id, { platformFeePct })}
              />
              <SliderField
                label="Return rate"
                value={selected.returnRatePct}
                min={0}
                max={40}
                step={0.5}
                suffix="%"
                onChange={(returnRatePct) => updateProduct(selected.id, { returnRatePct })}
                hint="Refunds plus partial fulfilment loss on returned units."
              />
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  )
}
