import { CostCharts } from './components/CostCharts'
import { Header } from './components/Header'
import { HealthScorePanel } from './components/HealthScorePanel'
import { Hero } from './components/Hero'
import { HistoryPanel } from './components/HistoryPanel'
import { LeaksPanel } from './components/LeaksPanel'
import { MetricStrip } from './components/MetricStrip'
import { ProductWorkspace } from './components/ProductWorkspace'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { ScenarioCompare } from './components/ScenarioCompare'
import { UpgradeModal } from './components/UpgradeModal'
import { AppProvider } from './context/AppContext'

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-bg text-ink">
        <Header />
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
          <ScenarioCompare />
          <HistoryPanel />
        </main>
        <footer className="border-t border-border py-8 text-center text-sm text-subtle">
          <p className="font-display text-base font-semibold text-ink">MarginOS</p>
          <p className="mt-1">One price, no subscription. Pro £19 lifetime via Lemon Squeezy.</p>
          <p className="mt-2 text-xs">Built to the approved product specification · Demo unlock is local only</p>
        </footer>
        <UpgradeModal />
      </div>
    </AppProvider>
  )
}
