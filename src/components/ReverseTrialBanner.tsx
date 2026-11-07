import { useApp } from '../context/AppContext'
import { PLANS, formatGbp } from '../lib/plans'
import { Button } from './ui'

/** K52 in-app reverse-trial banner + Keep Pro. */
export function ReverseTrialBanner() {
  const { access, plan, trialEntitlement, trialEndsAt, billingInterval, keepPro } = useApp()
  if (access !== 'trial' || !trialEndsAt) return null

  const end = new Date(trialEndsAt)
  const endLabel = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const entitlement = trialEntitlement ?? (plan === 'scale' ? 'scale' : 'pro')
  const annual = billingInterval === 'year'
  const chosenPrice =
    plan === 'none' || plan === 'legacy'
      ? null
      : annual
        ? PLANS[plan].annualGbp
        : PLANS[plan].monthlyGbp

  if (plan === 'pro' || plan === 'scale' || entitlement === plan) {
    return (
      <div className="border-b border-accent/25 bg-accent-soft px-4 py-2.5 text-sm text-navy sm:px-6">
        You’re on your {PLANS[entitlement].name} free trial until {endLabel}.
      </div>
    )
  }

  if (plan === 'none' || plan === 'legacy' || chosenPrice == null) return null

  return (
    <div className="border-b border-accent/25 bg-accent-soft px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-navy">
          You’re trying Pro free until {endLabel}. Your {PLANS[plan].name} plan starts on {endLabel} at{' '}
          {formatGbp(chosenPrice)}
          {annual ? '/year' : '/mo'}.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            keepPro()
          }}
        >
          Keep Pro for {formatGbp(annual ? PLANS.pro.annualGbp : PLANS.pro.monthlyGbp)}
          {annual ? ' a year' : '/mo'}
        </Button>
      </div>
    </div>
  )
}
