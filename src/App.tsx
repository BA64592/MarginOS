import { AuthModal } from './components/AuthModal'
import { BrowserSupportBanner } from './components/BrowserSupportBanner'
import { CalculatorsPanel } from './components/CalculatorsPanel'
import { CostCharts } from './components/CostCharts'
import {
  DashboardShell,
  useDashboardFilters,
  type DashSection,
} from './components/dashboard/DashboardShell'
import { HealthScorePanel } from './components/HealthScorePanel'
import { InactivityBanner } from './components/InactivityBanner'
import { LeaksPanel } from './components/LeaksPanel'
import { MetricStrip } from './components/MetricStrip'
import { HomePage } from './components/marketing/HomePage'
import { MarketingChrome } from './components/marketing/MarketingChrome'
import { SampleReportPage } from './components/marketing/SampleReportPage'
import { PricingPage } from './components/PricingPage'
import { ProductWorkspace } from './components/ProductWorkspace'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { SavedDatasets } from './components/SavedDatasets'
import { ScenarioCompare } from './components/ScenarioCompare'
import { SettingsBar } from './components/SettingsBar'
import { UpgradeModal } from './components/UpgradeModal'
import { Button } from './components/ui'
import { AppProvider, useApp } from './context/AppContext'
import { en } from './i18n/en'
import { PRODUCT_NAME } from './lib/brand'

function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrowserSupportBanner />
      <MarketingChrome>{children}</MarketingChrome>
      <UpgradeModal />
      <AuthModal />
    </>
  )
}

function showOn(section: DashSection, targets: DashSection[]) {
  return targets.includes(section)
}

function DashboardMain() {
  const { setRoute } = useApp()
  const filters = useDashboardFilters()
  const section = filters?.section ?? 'overview'

  return (
    <>
      <InactivityBanner />
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
        {showOn(section, ['overview']) ? (
          <section id="dash-overview" className="space-y-6 scroll-mt-28">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Overview</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
                Profit diagnosis
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-subtle">
                KPI summary first, then ranked fixes and cost visuals. Use the filter bar for period and
                platforms.
              </p>
            </div>
            <MetricStrip />
            <RecommendationsPanel />
          </section>
        ) : null}

        {showOn(section, ['overview', 'workspace']) ? (
          <section id="dash-workspace" className="scroll-mt-28">
            <div id="workspace">
              <ProductWorkspace />
            </div>
          </section>
        ) : null}

        {showOn(section, ['overview', 'leaks']) ? (
          <section id="dash-leaks" className="scroll-mt-28 space-y-10">
            <LeaksPanel />
            {section === 'leaks' ? <RecommendationsPanel /> : null}
          </section>
        ) : null}

        {showOn(section, ['overview', 'charts']) ? (
          <section id="dash-charts" className="scroll-mt-28 space-y-10">
            <HealthScorePanel />
            <CostCharts />
          </section>
        ) : null}

        {showOn(section, ['calculators']) ? (
          <section id="dash-calculators" className="scroll-mt-28">
            <CalculatorsPanel />
          </section>
        ) : null}

        {showOn(section, ['scenarios']) ? (
          <section id="dash-scenarios" className="scroll-mt-28">
            <ScenarioCompare />
          </section>
        ) : null}

        {showOn(section, ['settings']) ? (
          <section id="dash-settings" className="scroll-mt-28 space-y-10">
            <SavedDatasets />
            <SettingsBar />
          </section>
        ) : null}
      </main>
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-subtle sm:px-6">
        <p className="font-display text-base font-bold text-navy">{PRODUCT_NAME}</p>
        <p className="mt-1">{en.tagline}</p>
        <p className="mt-2">{en.platformsLaunchLine}</p>
        <p className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
          <Button variant="ghost" size="sm" onClick={() => setRoute('home')}>
            Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRoute('sample')}>
            Sample report
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRoute('pricing')}>
            Pricing
          </Button>
        </p>
      </footer>
    </>
  )
}

function ProductShell() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <BrowserSupportBanner />
      <DashboardShell>
        <DashboardMain />
      </DashboardShell>
      <UpgradeModal />
      <AuthModal />
    </div>
  )
}

function AppShell() {
  const { route } = useApp()

  if (route === 'home') {
    return (
      <MarketingShell>
        <HomePage />
      </MarketingShell>
    )
  }
  if (route === 'pricing') {
    return (
      <MarketingShell>
        <PricingPage />
      </MarketingShell>
    )
  }
  if (route === 'sample') {
    return (
      <MarketingShell>
        <SampleReportPage />
      </MarketingShell>
    )
  }

  return <ProductShell />
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
