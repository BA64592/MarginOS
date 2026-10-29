import { FileDown, Moon, Sparkles, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { exportPdfReport } from '../lib/pdf'
import { Badge, Button } from './ui'

export function Header() {
  const { plan, theme, toggleTheme, setUpgradeOpen, setPlan, result, scenarios, history } =
    useApp()

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white dark:text-slate-950">
            M
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                MarginOS
              </h1>
              <Badge tone={plan === 'pro' ? 'pro' : 'neutral'}>
                {plan === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
            <p className="hidden truncate text-xs text-subtle sm:block">
              Find where your margin leaks — one price, no subscription.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="px-2"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              if (plan !== 'pro') {
                setUpgradeOpen(true)
                return
              }
              void exportPdfReport({ result, scenarios, history })
            }}
          >
            <FileDown className="h-4 w-4" />
            PDF
          </Button>

          {plan === 'free' ? (
            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden xs:inline">Upgrade</span>
              <span className="sm:hidden">Pro</span>
              <span className="hidden sm:inline">Upgrade · £19</span>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setPlan('free')}>
              Switch to Free
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
