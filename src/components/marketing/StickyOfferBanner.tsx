import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { TRIAL_DAYS, formatGbp, PLANS } from '../../lib/plans'
import { Button } from '../ui'

const DISMISS_KEY = 'marginos.stickyOffer.dismissed'

export function StickyOfferBanner() {
  const { setUpgradeOpen, setRoute } = useApp()
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="min-w-0 text-sm leading-snug">
          <span className="font-semibold">{TRIAL_DAYS}-day free trial</span>
          <span className="hidden text-white/75 sm:inline">
            {' '}
            · Card required · Cancel before day {TRIAL_DAYS} to pay nothing · from{' '}
            {formatGbp(PLANS.starter.monthlyGbp)}/mo
          </span>
          <span className="text-white/75 sm:hidden"> · Cancel anytime</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="bg-white text-navy hover:bg-white/90"
            onClick={() => setUpgradeOpen(true)}
          >
            Start trial
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hidden text-white/80 hover:bg-white/10 hover:text-white sm:inline-flex"
            onClick={() => setRoute('pricing')}
          >
            Compare plans
          </Button>
          <button
            type="button"
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-[10px] text-white/70 hover:bg-white/10 hover:text-white"
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
