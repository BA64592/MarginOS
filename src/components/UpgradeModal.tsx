import { Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button, Modal } from './ui'

const PRO_PERKS = [
  'Unlimited products & CSV uploads',
  'Health score breakdown by cost area and product',
  'Every margin leak ranked by £ impact',
  'Specific actions for every leak',
  'Side-by-side scenario comparison',
  'Branded PDF reports & saved history',
]

export function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen, setPlan } = useApp()

  return (
    <Modal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Upgrade to MarginOS Pro">
      <p className="mb-4 text-sm text-subtle">
        Lifetime access for <span className="font-semibold text-ink">£19</span> — no subscription,
        no order caps. Checkout would run via Lemon Squeezy in production; this demo unlocks Pro
        locally.
      </p>
      <ul className="mb-5 space-y-2">
        {PRO_PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {perk}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          onClick={() => {
            setPlan('pro')
            setUpgradeOpen(false)
          }}
        >
          Unlock Pro · £19
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setUpgradeOpen(false)}>
          Stay on Free
        </Button>
      </div>
    </Modal>
  )
}
