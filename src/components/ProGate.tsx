import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { cn } from '../lib/cn'
import type { PlanFeature } from '../lib/plans'
import { trialPaywallCopy } from '../lib/pricing'
import { Button } from './ui'

/** Tier-gated panel. Keeps export name ProGate for existing imports. */
export function ProGate({
  children,
  label = 'Paid plan feature',
  className,
  compact = false,
  feature = 'overheads',
}: {
  children: ReactNode
  label?: string
  className?: string
  compact?: boolean
  feature?: PlanFeature
}) {
  // Use context hasFeature so K52 reverse-trial entitlementPlan is honoured (F5)
  const { hasFeature, setUpgradeOpen } = useApp()

  if (hasFeature(feature)) return <>{children}</>

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <div className="pointer-events-none select-none blur-[2px] opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-bg/55 p-4 backdrop-blur-[1px]">
        <div
          className={cn(
            'w-full max-w-sm rounded-xl border border-border bg-elevated text-center',
            compact ? 'p-3' : 'p-4',
          )}
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-semibold text-ink">
            <Lock className="h-3.5 w-3.5" />
            {label}
          </div>
          <p className={cn('text-subtle', compact ? 'mb-2 text-xs' : 'mb-3 text-sm')}>
            {trialPaywallCopy('growth', 'month')}
          </p>
          <Button size="sm" onClick={() => setUpgradeOpen(true)}>
            View plans
          </Button>
        </div>
      </div>
    </div>
  )
}
