import { useState } from 'react'
import {
  IN_APP_BROWSER_COPY,
  SUPPORTED_BROWSERS_COPY,
  isInAppBrowser,
  isLikelyUnsupportedBrowser,
} from '../lib/browserEnv'
import { Button } from './ui'

function detectMode(): 'none' | 'inapp' | 'unsupported' {
  if (typeof navigator === 'undefined') return 'none'
  if (isInAppBrowser()) return 'inapp'
  if (isLikelyUnsupportedBrowser()) return 'unsupported'
  return 'none'
}

export function BrowserSupportBanner() {
  const [mode] = useState(detectMode)
  const [copied, setCopied] = useState(false)
  const href = typeof window !== 'undefined' ? window.location.href : ''

  if (mode === 'none') return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      role="status"
      className="border-b border-warn/30 bg-warn-soft px-4 py-3 text-center text-sm text-warn sm:px-6"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <p className="mx-auto max-w-3xl">
        {mode === 'inapp' ? IN_APP_BROWSER_COPY : SUPPORTED_BROWSERS_COPY}
      </p>
      {mode === 'inapp' ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" variant="secondary" type="button" onClick={() => void copyLink()}>
            {copied ? 'Link copied' : 'Copy link'}
          </Button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-elevated px-3 text-sm font-medium text-ink"
          >
            Open in browser
          </a>
        </div>
      ) : null}
    </div>
  )
}
