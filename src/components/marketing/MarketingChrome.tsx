import { useApp } from '../../context/AppContext'
import { en } from '../../i18n/en'
import { PRODUCT_NAME } from '../../lib/brand'
import { BrandLockup } from '../BrandMark'
import { Button } from '../ui'

const NAV: { id: 'home' | 'sample' | 'pricing' | 'app'; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'sample', label: 'Sample report' },
  { id: 'pricing', label: 'Pricing' },
]

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const { route, setRoute, setAuthOpen, setUpgradeOpen } = useApp()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => setRoute('home')} aria-label={PRODUCT_NAME}>
            <BrandLockup />
          </button>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoute(item.id)}
                className={`min-h-10 rounded-[10px] px-3 text-sm font-medium transition ${
                  route === item.id ? 'bg-muted text-navy' : 'text-subtle hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
              Start free trial
            </Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoute(item.id)}
              className={`min-h-10 shrink-0 rounded-[10px] px-3 text-sm font-medium ${
                route === item.id ? 'bg-muted text-navy' : 'text-subtle'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {children}

      <footer className="border-t border-border bg-elevated px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <BrandLockup />
            <p className="mt-3 text-sm text-subtle">{en.tagline}</p>
            <p className="mt-2 text-sm text-subtle">{en.platformsLaunchLine}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-navy">Product</p>
              <button type="button" className="block text-subtle hover:text-ink" onClick={() => setRoute('home')}>
                Home
              </button>
              <button type="button" className="block text-subtle hover:text-ink" onClick={() => setRoute('sample')}>
                Sample report
              </button>
              <button type="button" className="block text-subtle hover:text-ink" onClick={() => setRoute('pricing')}>
                Pricing
              </button>
              <button type="button" className="block text-subtle hover:text-ink" onClick={() => setRoute('app')}>
                Open app
              </button>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-navy">Legal</p>
              <span className="block text-subtle">Terms</span>
              <span className="block text-subtle">Privacy</span>
              <span className="block text-subtle">Refunds &amp; cancellation</span>
              <span className="block text-subtle">DPA / subprocessors</span>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-navy">Help</p>
              <span className="block text-subtle">Help centre</span>
              <span className="block text-subtle">Contact</span>
              <button type="button" className="block text-subtle hover:text-ink" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-subtle">
          {PRODUCT_NAME} is a working name pending trademark clearance. Plans from £39/month including VAT after
          trial.
        </p>
      </footer>
    </div>
  )
}
