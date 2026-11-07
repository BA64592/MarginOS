import { useEffect, useRef, useState, type RefObject } from 'react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { platformLabel } from '../lib/platforms'
import type { Platform } from '../lib/types'
import { FreeUploadPolicyNote } from './FreeRetentionBanner'
import { Button, Card } from './ui'

export function PlatformImport() {
  const {
    currency,
    importPlatformOrders,
    user,
    setAuthOpen,
    uploadsLeft,
    plan,
    platformSlotLimit,
  } = useApp()
  const enabled =
    user?.enabledPlatforms && user.enabledPlatforms.length > 0
      ? user.enabledPlatforms
      : ([] as Platform[])
  const [platform, setPlatform] = useState<Platform>('shopify')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const primaryRef = useRef<HTMLInputElement>(null)
  const secondaryRef = useRef<HTMLInputElement>(null)
  const tertiaryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (enabled.length && !enabled.includes(platform)) {
      setPlatform(enabled[0])
    }
  }, [enabled, platform])

  const run = async () => {
    if (!user) {
      setAuthOpen(true)
      setMessage('Sign in and verify your email before uploading.')
      return
    }
    const read = async (ref: RefObject<HTMLInputElement | null>) => {
      const f = ref.current?.files?.[0]
      return f ? f.text() : undefined
    }

    setBusy(true)
    setMessage('Importing…')
    try {
      // Yield so the UI can paint progress before sync parse work.
      await new Promise((r) => window.setTimeout(r, 0))
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
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mb-4" id="platform-upload" tabIndex={-1}>
      <p className="mb-2 text-sm font-semibold text-ink">Upload platform orders</p>
      <p className="mb-2 text-xs text-subtle">
        Upload exports for your chosen platforms ({platformSlotLimit} of 3 on your plan). Buyer
        personal details are stripped on import.
        {plan === 'none' ? ` · ${uploadsLeft} of 3 uploads left today.` : ''}{' '}
        {en.tiktokComingSoon}.
      </p>
      <div className="mb-3">
        <FreeUploadPolicyNote />
      </div>
      {user && !user.enabledPlatforms?.length ? (
        <p className="mb-3 rounded-[10px] bg-warn-soft px-3 py-2 text-xs text-warn">
          Choose your platform(s) in Account before uploading ({platformSlotLimit} of 3).{' '}
          <button type="button" className="font-semibold underline" onClick={() => setAuthOpen(true)}>
            Open Account
          </button>
        </p>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-2">
        {enabled.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={platform === p ? 'primary' : 'secondary'}
            onClick={() => setPlatform(p)}
          >
            {platformLabel(p)}
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-subtle">
          {platform === 'shopify' && 'Shopify Orders export (required)'}
          {platform === 'amazon' && 'Amazon Transaction report (required)'}
          {platform === 'etsy' && 'Etsy Orders CSV (required)'}
          <input ref={primaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
        </label>
        {platform === 'shopify' ? (
          <label className="text-xs text-subtle">
            Shopify Payments transactions (optional — actual fees)
            <input ref={secondaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
          </label>
        ) : null}
        {platform === 'etsy' ? (
          <>
            <label className="text-xs text-subtle">
              Etsy Order Items CSV (required)
              <input ref={secondaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-xs text-subtle sm:col-span-2">
              Etsy Monthly Statement (optional — actual fees / labels)
              <input ref={tertiaryRef} type="file" accept=".csv,text/csv" className="mt-1 block w-full text-sm" />
            </label>
            <p className="text-xs text-subtle sm:col-span-2">{en.etsyMultiFileHint}</p>
          </>
        ) : null}
      </div>
      <div className="mt-3">
        <Button size="sm" disabled={busy} onClick={() => void run()}>
          {busy ? 'Importing…' : `Import ${platformLabel(platform)} CSV`}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-subtle">{message}</p> : null}
    </Card>
  )
}
