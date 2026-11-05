import { Sparkles, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PRODUCT_NAME } from '../lib/brand'
import { isDemoHarnessEnabled } from '../lib/demoFlags'
import { PLANS, hasPaidAccess } from '../lib/plans'
import { heroCta } from '../lib/pricing'
import { BrandLockup } from './BrandMark'
import { Badge, Button } from './ui'

function planBadgeLabel(plan: string) {
  if (plan === 'legacy') return 'Pro (lifetime)'
  if (plan === 'starter' || plan === 'growth' || plan === 'pro' || plan === 'scale') {
    return PLANS[plan].name
  }
  return 'Sample'
}

export function Header() {
  const {
    plan,
    access,
    setUpgradeOpen,
    switchToFree,
    setAuthOpen,
    user,
    setRoute,
  } = useApp()

  const subscribed = hasPaidAccess(access)

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="min-w-0" onClick={() => setRoute('app')} aria-label={PRODUCT_NAME}>
            <BrandLockup />
          </button>
          <Badge tone={subscribed ? 'pro' : 'neutral'}>{planBadgeLabel(plan)}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setRoute('pricing')}
          >
            Pricing
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => setAuthOpen(true)}
            aria-label="Account"
          >
            <User className="h-4 w-4" />
          </Button>
          {!subscribed ? (
            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{heroCta()}</span>
              <span className="sm:hidden">Trial</span>
            </Button>
          ) : isDemoHarnessEnabled() ? (
            <Button size="sm" variant="secondary" onClick={switchToFree}>
              End access (demo)
            </Button>
          ) : null}
        </div>
      </div>
      {user && !user.emailVerified ? (
        <div className="border-t border-warn/30 bg-warn-soft px-4 py-2 text-center text-xs text-warn sm:px-6">
          Verify your email before your first upload.{' '}
          <button type="button" className="font-semibold underline" onClick={() => setAuthOpen(true)}>
            Verify now
          </button>
        </div>
      ) : null}
      <select className="hidden" aria-hidden="true" defaultValue="en">
        <option value="en">English</option>
      </select>
    </header>
  )
}
