import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useApp } from '../context/AppContext'
import { cn } from '../lib/cn'
import { proUnlockPaywallCopy } from '../lib/pricing'
import { Button } from './ui'

export function ProGate({
  children,
  label = 'Pro feature',
  className,
  compact = false,
}: {
  children: ReactNode
  label?: string
  className?: string
  compact?: boolean
}) {
  const { plan, setUpgradeOpen, currency, earlyBirdLeft } = useApp()

  if (plan === 'pro') return <>{children}</>

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
          {!compact ? (
            <p className="mb-3 text-sm text-subtle">
              {proUnlockPaywallCopy(currency, earlyBirdLeft)}
            </p>
          ) : (
            <p className="mb-2 text-xs text-subtle">
              {proUnlockPaywallCopy(currency, earlyBirdLeft)}
            </p>
          )}
          <Button size="sm" onClick={() => setUpgradeOpen(true)}>
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  )
}
