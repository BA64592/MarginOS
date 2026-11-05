import { AuthModal } from './components/AuthModal'
import { BrowserSupportBanner } from './components/BrowserSupportBanner'
import { CalculatorsPanel } from './components/CalculatorsPanel'
import { CostCharts } from './components/CostCharts'
import { Header } from './components/Header'
import { HealthScorePanel } from './components/HealthScorePanel'
import { Hero } from './components/Hero'
import { InactivityBanner } from './components/InactivityBanner'
import { LeaksPanel } from './components/LeaksPanel'
import { MetricStrip } from './components/MetricStrip'
import { PricingPage } from './components/PricingPage'
import { ProductWorkspace } from './components/ProductWorkspace'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { SavedDatasets } from './components/SavedDatasets'
import { ScenarioCompare } from './components/ScenarioCompare'
import { SettingsBar } from './components/SettingsBar'
import { UpgradeModal } from './components/UpgradeModal'
import { AppProvider, useApp } from './context/AppContext'
import { en } from './i18n/en'
import { PRODUCT_NAME } from './lib/brand'

function AppShell() {
  const { route, setRoute } = useApp()

  if (route === 'pricing') {
    return (
      <div className="min-h-screen bg-bg text-ink">
        <BrowserSupportBanner />
        <Header />
        <PricingPage />
        <UpgradeModal />
        <AuthModal />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <BrowserSupportBanner />
      <Header />
      <InactivityBanner />
      <Hero />
      <main className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-12">
        <MetricStrip />
        <div id="workspace">
          <ProductWorkspace />
        </div>
        <HealthScorePanel />
        <CostCharts />
        <LeaksPanel />
        <RecommendationsPanel />
        <CalculatorsPanel />
        <ScenarioCompare />
        <SavedDatasets />
        <SettingsBar />
      </main>
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-subtle sm:px-6">
        <p className="font-display text-base font-bold text-navy">{PRODUCT_NAME}</p>
        <p className="mt-1">{en.tagline}</p>
        <p className="mt-1">{en.positioning}</p>
        <p className="mt-2">{en.platformsLaunchLine}</p>
        <p className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => setRoute('pricing')}>
            Pricing
          </button>
          <span aria-hidden>·</span>
          <span>Terms</span>
          <span aria-hidden>·</span>
          <span>Privacy</span>
          <span aria-hidden>·</span>
          <span>Refunds &amp; cancellation</span>
          <span aria-hidden>·</span>
          <span>Help</span>
        </p>
      </footer>
      <UpgradeModal />
      <AuthModal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
