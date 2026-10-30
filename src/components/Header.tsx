import { FileDown, Moon, Sparkles, Sun, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { en } from '../i18n/en'
import { exportPdfReport } from '../lib/pdf'
import { proShortCta } from '../lib/pricing'
import { Badge, Button } from './ui'

export function Header() {
  const {
    plan,
    theme,
    toggleTheme,
    setUpgradeOpen,
    switchToFree,
    setAuthOpen,
    user,
    result,
    scenarioResults,
    currency,
    earlyBirdLeft,
    usingSampleData,
  } = useApp()

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
                {en.brand}
              </h1>
              <Badge tone={plan === 'pro' ? 'pro' : 'neutral'}>
                {plan === 'pro' ? en.pro : en.free}
              </Badge>
            </div>
            <p className="hidden truncate text-xs text-subtle sm:block">{en.positioning}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Toggle dark mode" onClick={toggleTheme} className="px-2">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => {
              if (plan !== 'pro') {
                setUpgradeOpen(true)
                return
              }
              exportPdfReport({ result, scenarios: scenarioResults, currency, usingSampleData })
            }}
          >
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          {plan === 'free' ? (
            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{proShortCta(currency, earlyBirdLeft)}</span>
              <span className="sm:hidden">Pro</span>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={switchToFree}>
              Switch to Free
            </Button>
          )}
        </div>
      </div>
      {user && !user.emailVerified ? (
        <div className="border-t border-warn/30 bg-warn-soft px-4 py-2 text-center text-xs text-warn sm:px-6">
          {en.verifyEmail}{' '}
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
