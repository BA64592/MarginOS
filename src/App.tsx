import { AuthModal } from './components/AuthModal'
import { CalculatorsPanel } from './components/CalculatorsPanel'
import { CostCharts } from './components/CostCharts'
import { Header } from './components/Header'
import { HealthScorePanel } from './components/HealthScorePanel'
import { Hero } from './components/Hero'
import { LeaksPanel } from './components/LeaksPanel'
import { MetricStrip } from './components/MetricStrip'
import { ProductWorkspace } from './components/ProductWorkspace'
import { RecommendationsPanel } from './components/RecommendationsPanel'
import { SavedDatasets } from './components/SavedDatasets'
import { ScenarioCompare } from './components/ScenarioCompare'
import { SettingsBar } from './components/SettingsBar'
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
          <CalculatorsPanel />
          <ScenarioCompare />
          <SavedDatasets />
          <SettingsBar />
        </main>
        <footer className="border-t border-border py-8 text-center text-sm text-subtle">
          <p className="font-display text-base font-semibold text-ink">MarginOS</p>
          <p className="mt-1">One price, yours for life.</p>
        </footer>
        <UpgradeModal />
        <AuthModal />
      </div>
    </AppProvider>
  )
}
