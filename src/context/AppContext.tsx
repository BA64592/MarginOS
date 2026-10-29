import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createBlankProduct, createScenario, sampleProducts } from '../data/sampleProducts'
import {
  FREE_CSV_UPLOAD_LIMIT,
  FREE_PRODUCT_LIMIT,
  analyzePortfolio,
  applyAdjustments,
  createId,
  emptyAdjustments,
} from '../lib/calc'
import { parseProductsCsv } from '../lib/csv'
import { loadState, saveState } from '../lib/storage'
import type {
  HistorySnapshot,
  Plan,
  PortfolioResult,
  Product,
  Scenario,
  ScenarioAdjustments,
} from '../lib/types'

interface AppContextValue {
  plan: Plan
  theme: 'light' | 'dark'
  products: Product[]
  scenarios: Scenario[]
  activeScenarioId: string | null
  csvUploadCount: number
  history: HistorySnapshot[]
  upgradeOpen: boolean
  result: PortfolioResult
  scenarioResults: { scenario: Scenario; result: PortfolioResult }[]
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  setPlan: (plan: Plan) => void
  toggleTheme: () => void
  setUpgradeOpen: (open: boolean) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  addProduct: () => void
  removeProduct: (id: string) => void
  importCsv: (text: string) => { ok: boolean; error?: string }
  resetSample: () => void
  createScenarioFromCurrent: (name?: string) => void
  updateScenario: (id: string, patch: Partial<Scenario>) => void
  setScenarioAdjustments: (id: string, adjustments: ScenarioAdjustments) => void
  removeScenario: (id: string) => void
  setActiveScenarioId: (id: string | null) => void
  saveHistorySnapshot: (label?: string) => void
  clearHistory: () => void
  canAddProduct: boolean
  canUploadCsv: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

function initialTheme(): 'light' | 'dark' {
  const saved = loadState()
  if (saved?.theme) return saved.theme
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const saved = loadState()
  const [plan, setPlan] = useState<Plan>(saved?.plan ?? 'free')
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme)
  const [products, setProducts] = useState<Product[]>(saved?.products ?? sampleProducts)
  const [scenarios, setScenarios] = useState<Scenario[]>(
    saved?.scenarios ?? [
      createScenario('Current month', sampleProducts),
      {
        ...createScenario('Lower ads / fewer returns', sampleProducts),
        adjustments: { ...emptyAdjustments(), adSpendPct: -20, returnRatePct: -30 },
      },
    ],
  )
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(
    saved?.activeScenarioId ?? null,
  )
  const [csvUploadCount, setCsvUploadCount] = useState(saved?.csvUploadCount ?? 0)
  const [history, setHistory] = useState<HistorySnapshot[]>(saved?.history ?? [])
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    (saved?.products ?? sampleProducts)[0]?.id ?? null,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    saveState({
      version: 1,
      plan,
      theme,
      products,
      scenarios,
      activeScenarioId,
      csvUploadCount,
      history,
      upgradeOpen: false,
    })
  }, [plan, theme, products, scenarios, activeScenarioId, csvUploadCount, history])

  const result = useMemo(() => analyzePortfolio(products), [products])

  const scenarioResults = useMemo(
    () =>
      scenarios.map((scenario) => ({
        scenario,
        result: analyzePortfolio(applyAdjustments(scenario.products, scenario.adjustments)),
      })),
    [scenarios],
  )

  const canAddProduct = plan === 'pro' || products.length < FREE_PRODUCT_LIMIT
  const canUploadCsv = plan === 'pro' || csvUploadCount < FREE_CSV_UPLOAD_LIMIT

  const value: AppContextValue = {
    plan,
    theme,
    products,
    scenarios,
    activeScenarioId,
    csvUploadCount,
    history,
    upgradeOpen,
    result,
    scenarioResults,
    selectedProductId,
    setSelectedProductId,
    setPlan,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    setUpgradeOpen,
    updateProduct: (id, patch) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    addProduct: () => {
      if (!canAddProduct) {
        setUpgradeOpen(true)
        return
      }
      const next = createBlankProduct()
      setProducts((prev) => [...prev, next])
      setSelectedProductId(next.id)
    },
    removeProduct: (id) => {
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== id)
        if (selectedProductId === id) setSelectedProductId(next[0]?.id ?? null)
        return next
      })
    },
    importCsv: (text) => {
      if (!canUploadCsv) {
        setUpgradeOpen(true)
        return { ok: false, error: 'Free plan allows one CSV upload. Upgrade to Pro for unlimited uploads.' }
      }
      const parsed = parseProductsCsv(text)
      if (parsed.error) return { ok: false, error: parsed.error }
      let next = parsed.products
      if (plan === 'free' && next.length > FREE_PRODUCT_LIMIT) {
        next = next.slice(0, FREE_PRODUCT_LIMIT)
      }
      setProducts(next)
      setSelectedProductId(next[0]?.id ?? null)
      setCsvUploadCount((c) => c + 1)
      return { ok: true }
    },
    resetSample: () => {
      const next = sampleProducts.map((p) => ({ ...p, id: createId('prod') }))
      setProducts(next)
      setSelectedProductId(next[0]?.id ?? null)
    },
    createScenarioFromCurrent: (name) => {
      if (plan !== 'pro') {
        setUpgradeOpen(true)
        return
      }
      const scenario = createScenario(name ?? `Scenario ${scenarios.length + 1}`, products)
      setScenarios((prev) => [...prev, scenario])
      setActiveScenarioId(scenario.id)
    },
    updateScenario: (id, patch) => {
      setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    setScenarioAdjustments: (id, adjustments) => {
      setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, adjustments } : s)))
    },
    removeScenario: (id) => {
      setScenarios((prev) => prev.filter((s) => s.id !== id))
      if (activeScenarioId === id) setActiveScenarioId(null)
    },
    setActiveScenarioId,
    saveHistorySnapshot: (label) => {
      if (plan !== 'pro') {
        setUpgradeOpen(true)
        return
      }
      const snap: HistorySnapshot = {
        id: createId('hist'),
        label: label ?? new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        trueProfit: result.totals.trueProfit,
        marginPct: result.totals.marginPct,
        healthScore: result.healthScore,
        productCount: products.length,
      }
      setHistory((prev) => [snap, ...prev].slice(0, 24))
    },
    clearHistory: () => setHistory([]),
    canAddProduct,
    canUploadCsv,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
