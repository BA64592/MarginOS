import { useRef, useState, type RefObject } from 'react'
import { useApp } from '../context/AppContext'
import type { Platform } from '../lib/types'
import { Button, Card } from './ui'

export function PlatformImport() {
  const { currency, importPlatformOrders, user, setAuthOpen, uploadsLeft, plan } = useApp()
  const [platform, setPlatform] = useState<Platform>('shopify')
  const [message, setMessage] = useState<string | null>(null)
  const primaryRef = useRef<HTMLInputElement>(null)
  const secondaryRef = useRef<HTMLInputElement>(null)
  const tertiaryRef = useRef<HTMLInputElement>(null)

  const run = async () => {
    if (!user) {
      setAuthOpen(true)
      setMessage('Sign in and verify email before uploading.')
      return
    }
    const read = async (ref: RefObject<HTMLInputElement | null>) => {
      const f = ref.current?.files?.[0]
      return f ? f.text() : undefined
    }

    if (platform === 'shopify') {
      const primaryCsv = await read(primaryRef)
      const shopifyPaymentsCsv = await read(secondaryRef)
      const res = importPlatformOrders({
        platform: 'shopify',
        homeCurrency: currency,
        primaryCsv,
        shopifyPaymentsCsv,
      })
      setMessage(res.message)
      return
    }
    if (platform === 'etsy') {
      const etsyOrdersCsv = await read(primaryRef)
      const etsyItemsCsv = await read(secondaryRef)
      const etsyStatementCsv = await read(tertiaryRef)
      const res = importPlatformOrders({
        platform: 'etsy',
        homeCurrency: currency,
        etsyOrdersCsv,
        etsyItemsCsv,
        etsyStatementCsv,
      })
      setMessage(res.message)
      return
    }
    const primaryCsv = await read(primaryRef)
    const res = importPlatformOrders({
      platform: 'amazon',
      homeCurrency: currency,
      primaryCsv,
    })
    setMessage(res.message)
  }

  return (
    <Card className="mb-4">
      <p className="mb-2 text-sm font-semibold text-ink">Platform order CSV (v16.1 A1 mappings)</p>
      <p className="mb-3 text-xs text-subtle">
        Headers matched by name (case/space insensitive). Personal data columns are stripped. Columns marked
        “confirm” in the amendment still need real export checks (K1).
        {plan === 'free' ? ` · ${uploadsLeft} of 3 uploads left today.` : ''}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {(['shopify', 'amazon', 'etsy'] as Platform[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={platform === p ? 'primary' : 'secondary'}
            onClick={() => setPlatform(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-subtle">
          {platform === 'shopify' && 'Orders export (required)'}
          {platform === 'amazon' && 'Transaction report (required)'}
          {platform === 'etsy' && 'Orders CSV (required)'}
          <input ref={primaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
        </label>
        {platform === 'shopify' ? (
          <label className="text-xs text-subtle">
            Payments transactions (optional — actual fees)
            <input ref={secondaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
          </label>
        ) : null}
        {platform === 'etsy' ? (
          <>
            <label className="text-xs text-subtle">
              Order Items CSV (required)
              <input ref={secondaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-xs text-subtle sm:col-span-2">
              Monthly Statement (optional — actual fees / labels)
              <input ref={tertiaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
            </label>
          </>
        ) : null}
      </div>
      <div className="mt-3">
        <Button size="sm" onClick={() => void run()}>
          Import platform CSV
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-subtle">{message}</p> : null}
    </Card>
  )
}
