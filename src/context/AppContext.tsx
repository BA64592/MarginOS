import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  analyzeStore,
  applyScenarioToLines,
  buildSampleDataset,
} from '../lib/calc/analyze'
import { importPlatformFiles, type PlatformImportInput } from '../lib/csv/importPlatform'
import { compareFees } from '../lib/fees/presets'
import { createId } from '../lib/format'
import { demoAuthProvider } from '../lib/auth/provider'
import {
  EARLY_BIRD_CAP,
  earlyBirdPlacesLeft,
  mockStartCheckout,
} from '../lib/payments/provider'
import { loadState, saveState } from '../lib/storage'
import type {
  AdSpendEntry,
  AnalysisResult,
  AppPersistedState,
  AuthUser,
  HomeCurrency,
  OrderLine,
  Plan,
  ProductCostRow,
  SavedDataset,
  Scenario,
  ScenarioAdjustments,
  TaxSettings,
} from '../lib/types'

const defaultTax: TaxSettings = {
  pricesIncludeTax: true,
  businessCountry: 'GB',
  vatGstRegistered: false,
  vatGstFrom: null,
  euOss: false,
  euIoss: false,
  ukFlatRate: false,
  ukFlatRatePct: 0,
  usSelfCollectStates: [],
}

function emptyAdj(): ScenarioAdjustments {
  return {
    pricePct: 0,
    productCostPct: 0,
    adSpendPct: 0,
    returnRatePct: 0,
    shippingChargePct: 0,
    discountPct: 0,
  }
}

function todayKey(tz: string) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

interface AppContextValue {
  plan: Plan
  theme: 'light' | 'dark'
  currency: HomeCurrency
  user: AuthUser | null
  tax: TaxSettings
  targetMarginPct: number
  monthlyOverheads: number
  costs: ProductCostRow[]
  ads: AdSpendEntry[]
  lines: OrderLine[]
  scenarios: Scenario[]
  savedDatasets: SavedDataset[]
  uploadDay: { dateKey: string; used: number }
  uploadsLeft: number
  earlyBirdSold: number
  earlyBirdLeft: number
  result: AnalysisResult
  scenarioResults: { scenario: Scenario; result: AnalysisResult }[]
  upgradeOpen: boolean
  authOpen: boolean
  selectedSku: string | null
  feesComparable: boolean
  warnings: string[]
  setUpgradeOpen: (v: boolean) => void
  setAuthOpen: (v: boolean) => void
  setSelectedSku: (sku: string | null) => void
  toggleTheme: () => void
  setCurrency: (c: HomeCurrency) => void
  setTax: (patch: Partial<TaxSettings>) => void
  setTargetMarginPct: (n: number) => void
  setMonthlyOverheads: (n: number) => void
  signInEmail: (email: string, password: string) => void
  signInGoogle: (emailVerified: boolean) => void
  verifyEmail: () => void
  signOut: () => void
  loadSample: () => void
  recordSuccessfulUpload: () => boolean
  replaceOrders: (lines: OrderLine[]) => void
  importPlatformOrders: (
    input: PlatformImportInput,
  ) => { ok: boolean; message: string }
  replaceTemplate: (costs: ProductCostRow[], ads?: AdSpendEntry[]) => void
  feeMathsNotes: string[]
  updateCost: (sku: string, patch: Partial<ProductCostRow>) => void
  setAdTotalManual: (amount: number) => void
  unlockProDemo: (billingCountry: string) => { ok: boolean; message: string }
  switchToFree: () => void
  createScenario: () => void
  updateScenario: (id: string, patch: Partial<Scenario>) => void
  removeScenario: (id: string) => void
  saveDataset: (name: string) => void
  exportDataCsv: () => string
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const saved = loadState()
  const sample = buildSampleDataset(saved?.currency ?? 'GBP')

  const [plan, setPlan] = useState<Plan>(saved?.plan ?? 'free')
  const [theme, setTheme] = useState<'light' | 'dark'>(saved?.theme ?? 'light')
  const [currency, setCurrency] = useState<HomeCurrency>(saved?.currency ?? 'GBP')
  const [user, setUser] = useState<AuthUser | null>(saved?.user ?? null)
  const [tax, setTaxState] = useState<TaxSettings>(saved?.tax ?? defaultTax)
  const [targetMarginPct, setTargetMarginPct] = useState(saved?.targetMarginPct ?? 10)
  const [monthlyOverheads, setMonthlyOverheads] = useState(saved?.monthlyOverheads ?? 0)
  const [costs, setCosts] = useState<ProductCostRow[]>(saved?.costs ?? sample.costs)
  const [ads, setAds] = useState<AdSpendEntry[]>(
    saved?.ads ?? [
      {
        id: createId('ad'),
        channel: 'Blended',
        amount: sample.adSpend,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      },
    ],
  )
  const [lines, setLines] = useState<OrderLine[]>(saved?.lines ?? sample.lines)
  const [scenarios, setScenarios] = useState<Scenario[]>(
    saved?.scenarios ?? [
      { id: createId('scn'), name: 'Current', adjustments: emptyAdj() },
      {
        id: createId('scn'),
        name: 'Lower ads / fewer returns',
        adjustments: { ...emptyAdj(), adSpendPct: -20, returnRatePct: -30 },
      },
    ],
  )
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>(saved?.savedDatasets ?? [])
  const [uploadDay, setUploadDay] = useState(
    saved?.uploadDay ?? { dateKey: todayKey(saved?.user?.timeZone ?? 'Europe/London'), used: 0 },
  )
  const [earlyBirdSold, setEarlyBirdSold] = useState(saved?.earlyBirdSold ?? 0)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [selectedSku, setSelectedSku] = useState<string | null>(
    (saved?.costs ?? sample.costs)[0]?.sku ?? null,
  )

  const tz = user?.timeZone ?? 'Europe/London'
  const dayKey = todayKey(tz)
  useEffect(() => {
    if (uploadDay.dateKey !== dayKey) setUploadDay({ dateKey: dayKey, used: 0 })
  }, [dayKey, uploadDay.dateKey])

  const uploadsLeft = plan === 'pro' ? Infinity : Math.max(0, 3 - uploadDay.used)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const state: AppPersistedState = {
      version: 3,
      plan,
      theme,
      currency,
      user,
      tax,
      targetMarginPct,
      monthlyOverheads,
      conversionFeePct: 0,
      userFxRates: {},
      costs,
      ads,
      lines,
      scenarios,
      savedDatasets,
      uploadDay,
      earlyBirdSold,
      licenceActive: plan === 'pro',
      digitalListingSkus: costs.filter((c) => c.digital).map((c) => c.sku),
    }
    saveState(state)
  }, [
    plan,
    theme,
    currency,
    user,
    tax,
    targetMarginPct,
    monthlyOverheads,
    costs,
    ads,
    lines,
    scenarios,
    savedDatasets,
    uploadDay,
    earlyBirdSold,
  ])

  const adSpendTotal = ads.reduce((s, a) => s + a.amount, 0)
  const feeCmp = useMemo(() => compareFees(lines, currency), [lines, currency])
  const periodDays = useMemo(() => {
    if (!lines.length) return 30
    const dates = lines.map((l) => l.postingDate || l.orderDate).sort()
    const a = new Date(dates[0] + 'T00:00:00Z').getTime()
    const b = new Date(dates[dates.length - 1] + 'T00:00:00Z').getTime()
    return Math.max(1, Math.round((b - a) / 86400000) + 1)
  }, [lines])
  const overheadsForPeriod = (monthlyOverheads * periodDays) / 30

  const result = useMemo(
    () =>
      analyzeStore({
        lines,
        costs,
        adSpendTotal,
        overheadsForPeriod: plan === 'pro' ? overheadsForPeriod : 0,
        conversionFees: 0,
        currency,
        targetMarginPct,
        feesComparable: feeCmp.comparable,
        feesExcessPp: feeCmp.excessPp,
      }),
    [lines, costs, adSpendTotal, overheadsForPeriod, currency, targetMarginPct, feeCmp, plan],
  )

  const scenarioResults = useMemo(() => {
    if (plan !== 'pro') return []
    return scenarios.map((scenario) => {
      const applied = applyScenarioToLines(lines, costs, adSpendTotal, scenario.adjustments)
      return {
        scenario,
        result: analyzeStore({
          lines: applied.lines,
          costs: applied.costs,
          adSpendTotal: applied.adSpend,
          overheadsForPeriod,
          conversionFees: 0,
          currency,
          targetMarginPct,
          feesComparable: feeCmp.comparable,
          feesExcessPp: feeCmp.excessPp,
        }),
      }
    })
  }, [plan, scenarios, lines, costs, adSpendTotal, overheadsForPeriod, currency, targetMarginPct, feeCmp])

  const value: AppContextValue = {
    plan,
    theme,
    currency,
    user,
    tax,
    targetMarginPct,
    monthlyOverheads,
    costs,
    ads,
    lines,
    scenarios,
    savedDatasets,
    uploadDay,
    uploadsLeft: Number.isFinite(uploadsLeft) ? uploadsLeft : 999,
    earlyBirdSold,
    earlyBirdLeft: earlyBirdPlacesLeft(earlyBirdSold),
    result,
    scenarioResults,
    upgradeOpen,
    authOpen,
    selectedSku,
    feesComparable: feeCmp.comparable,
    feeMathsNotes: feeCmp.mathsNotes,
    warnings: [...result.warnings, ...feeCmp.mathsNotes.filter((n) => n.includes('DRAFT'))],
    setUpgradeOpen,
    setAuthOpen,
    setSelectedSku,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    setCurrency,
    setTax: (patch) => setTaxState((t) => ({ ...t, ...patch })),
    setTargetMarginPct,
    setMonthlyOverheads,
    signInEmail: (email, password) => {
      void demoAuthProvider.signInEmail(email, password).then((res) => {
        if (!res.ok || !res.session) return
        const tzGuess = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
        setUser({
          id: res.session.accountId,
          email: res.session.email,
          emailVerified: res.session.emailVerified,
          authProvider: 'email',
          createdAt: new Date().toISOString(),
          lastSignInAt: new Date().toISOString(),
          timeZone: tzGuess,
          timeZoneChangedAt: null,
        })
        setAuthOpen(false)
      })
    },
    signInGoogle: (emailVerified) => {
      void demoAuthProvider
        .signInGoogle({
          sub: 'demo-google-sub',
          email: 'seller@gmail.com',
          email_verified: emailVerified,
        })
        .then((res) => {
          if (!res.ok || !res.session) return
          const tzGuess = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
          setUser({
            id: res.session.accountId,
            email: res.session.email,
            emailVerified: res.session.emailVerified,
            authProvider: 'google',
            googleEmailVerified: emailVerified,
            createdAt: new Date().toISOString(),
            lastSignInAt: new Date().toISOString(),
            timeZone: tzGuess,
            timeZoneChangedAt: null,
          })
          setAuthOpen(false)
        })
    },
    verifyEmail: () => {
      void demoAuthProvider.verifyEmail('demo').then(() => {
        setUser((u) => (u ? { ...u, emailVerified: true } : u))
      })
    },
    signOut: () => setUser(null),
    loadSample: () => {
      const s = buildSampleDataset(currency)
      setLines(s.lines)
      setCosts(s.costs)
      setAds([
        {
          id: createId('ad'),
          channel: 'Blended',
          amount: s.adSpend,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
        },
      ])
      setSelectedSku(s.costs[0]?.sku ?? null)
    },
    recordSuccessfulUpload: () => {
      if (plan === 'pro') return true
      if (!user?.emailVerified) {
        setAuthOpen(true)
        return false
      }
      if (uploadsLeft <= 0) {
        setUpgradeOpen(true)
        return false
      }
      setUploadDay((d) => ({ dateKey: dayKey, used: d.dateKey === dayKey ? d.used + 1 : 1 }))
      return true
    },
    replaceOrders: (next) => setLines(next),
    importPlatformOrders: (input) => {
      if (!user?.emailVerified) {
        setAuthOpen(true)
        return { ok: false, message: 'Verify your email before your first upload.' }
      }
      if (plan === 'free' && uploadsLeft <= 0) {
        setUpgradeOpen(true)
        return { ok: false, message: '0 uploads left today.' }
      }
      const parsed = importPlatformFiles(input)
      if (!parsed.ok) {
        return { ok: false, message: parsed.errors.join(' ') || 'Import failed.' }
      }
      if (plan === 'free' && parsed.lines.length > 50000) {
        return {
          ok: false,
          message: 'Free uploads are limited to 50,000 orders. Use a shorter date range or Pro.',
        }
      }
      if (plan === 'free') {
        setUploadDay((d) => ({ dateKey: dayKey, used: d.dateKey === dayKey ? d.used + 1 : 1 }))
      }
      setLines(parsed.lines)
      if (parsed.ads.length) {
        setAds((prev) => (plan === 'pro' ? [...parsed.ads, ...prev] : prev))
      }
      const msg = [
        `Imported ${parsed.summary.newRows ?? parsed.lines.length} lines.`,
        ...parsed.warnings.slice(0, 3),
        ...parsed.mathsNotes.slice(0, 2),
      ].join(' ')
      return { ok: true, message: msg }
    },
    replaceTemplate: (nextCosts, nextAds) => {
      setCosts(nextCosts)
      if (nextAds) setAds(nextAds)
    },
    updateCost: (sku, patch) =>
      setCosts((prev) => prev.map((c) => (c.sku === sku ? { ...c, ...patch } : c))),
    setAdTotalManual: (amount) =>
      setAds([
        {
          id: createId('ad'),
          channel: plan === 'pro' ? 'Meta' : 'Blended',
          amount,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
        },
      ]),
    unlockProDemo: (billingCountry) => {
      if (!user) {
        setAuthOpen(true)
        return { ok: false, message: 'Sign in to buy Pro.' }
      }
      const res = mockStartCheckout({
        accountId: user.id,
        emailVerified: user.emailVerified,
        billingCountry,
        currency,
        alreadyPro: plan === 'pro',
        paymentPending: false,
        earlyBirdSold,
      })
      if (res.ok) {
        setPlan('pro')
        if (res.earlyBirdSold != null) setEarlyBirdSold(res.earlyBirdSold)
        // Free dataset carries into Pro shop
        setSavedDatasets((prev) => [
          {
            id: createId('ds'),
            name: 'Upgraded from Free',
            start: result.totals.period.start,
            end: result.totals.period.end,
            platforms: [...new Set(lines.map((l) => l.platform))],
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
        setUpgradeOpen(false)
      }
      return { ok: res.ok, message: res.message }
    },
    switchToFree: () => setPlan('free'),
    createScenario: () => {
      if (plan !== 'pro') {
        setUpgradeOpen(true)
        return
      }
      setScenarios((prev) => [
        ...prev,
        { id: createId('scn'), name: `Scenario ${prev.length + 1}`, adjustments: emptyAdj() },
      ])
    },
    updateScenario: (id, patch) =>
      setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    removeScenario: (id) => setScenarios((prev) => prev.filter((s) => s.id !== id)),
    saveDataset: (name) => {
      if (plan !== 'pro') {
        setUpgradeOpen(true)
        return
      }
      setSavedDatasets((prev) => [
        {
          id: createId('ds'),
          name,
          start: result.totals.period.start,
          end: result.totals.period.end,
          platforms: [...new Set(lines.map((l) => l.platform))],
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
    },
    exportDataCsv: () => {
      const header = 'sku,name,revenue,net_profit,net_margin_pct,verdict'
      const rows = result.products.map(
        (p) =>
          `${p.sku},"${p.name}",${p.revenue},${p.netProfit},${p.netMarginPct},${p.verdict}`,
      )
      return [header, ...rows].join('\n')
    },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { EARLY_BIRD_CAP }
