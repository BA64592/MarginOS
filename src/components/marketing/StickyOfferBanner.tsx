import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TRIAL_BANNER_LINE } from '../../lib/plans'

const DISMISS_KEY = 'marginos.stickyOffer.dismissed'

/**
 * K43 banner (word-for-word) + K46: on Pricing the banner is terms-only (no second CTA).
 * Dismissible; page reflows after dismiss (K45).
 */
export function StickyOfferBanner({ showCta = true }: { showCta?: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="border-b border-accent/25 bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2.5 sm:items-center sm:px-6">
        <p className="min-w-0 text-sm leading-snug sm:text-[15px]">{TRIAL_BANNER_LINE}</p>
        <div className="flex shrink-0 items-center gap-2">
          {/* K46: Pricing banner has no Start button — header owns the primary CTA */}
          {showCta ? null : null}
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-[10px] text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss offer banner"
            onClick={() => {
              try {
                sessionStorage.setItem(DISMISS_KEY, '1')
              } catch {
                /* ignore */
              }
              setVisible(false)
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
