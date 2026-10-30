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
import { logDataAction } from '../lib/auditLog'
import { en } from '../i18n/en'
import {
  applyPaymentFailure,
  earliestClock,
  formatDeletionTime,
  isExpired,
  pauseClocks,
  resumeOrCancelClocks,
  upsertClock,
} from '../lib/retention'
import { loadState, saveState } from '../lib/storage'
import type {
  AdSpendEntry,
  AnalysisResult,
  AppPersistedState,
  AuthUser,
  FreeRetentionClock,
  HomeCurrency,
  KeptProData,
  OrderLine,
  Plan,
  ProductCostRow,
  SavedDataset,
  Scenario,
  ScenarioAdjustments,
  TaxSettings,
} from '../lib/types'

const SAMPLE_CLEARED_NOTE = 'Sample data has been removed now that your own data is in.'

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

function defaultScenarios(): Scenario[] {
  return [
    { id: createId('scn'), name: 'Current', adjustments: emptyAdj() },
    {
      id: createId('scn'),
      name: 'Lower ads / fewer returns',
      adjustments: { ...emptyAdj(), adSpendPct: -20, returnRatePct: -30 },
    },
  ]
}

function countSample(lines: OrderLine[], costs: ProductCostRow[], ads: AdSpendEntry[]) {
  return {
    orderLines: lines.filter((l) => l.isSample).length,
    costRows: costs.filter((c) => c.isSample).length,
    adRows: ads.filter((a) => a.isSample).length,
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
  usingSampleData: boolean
  /** True when the shop has no own (non-sample) order lines. */
  isEmptyShop: boolean
  /** One-shot notice after automatic sample clear (v16.3 E9). */
  sampleClearedNotice: string | null
  dismissSampleClearedNotice: () => void
  /** Free 24h clocks (v16.4). Empty for Pro / sample-only. */
  freeClocks: FreeRetentionClock[]
  /** Earliest Free clock still running, if any. */
  earliestFreeClock: FreeRetentionClock | null
  freeDataDeletedNotice: string | null
  dismissFreeDataDeletedNotice: () => void
  keptProData: KeptProData | null
  paymentPending: boolean
  setPaymentPending: (v: boolean) => void
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
  /** Remove sample rows only — never uses a Free upload (v16.3 E2). */
  clearSampleData: () => void
  /** Delete all shop data; keep account, Pro and settings (v16.3 E3). */
  startFresh: () => void
  recordSuccessfulUpload: () => boolean
  replaceOrders: (lines: OrderLine[]) => void
  importPlatformOrders: (
    input: PlatformImportInput,
  ) => { ok: boolean; message: string }
  /** Apply MarginOS cost/ads template; returns Free deletion note when applicable (v16.4 F2). */
  replaceTemplate: (
    costs: ProductCostRow[],
    ads?: AdSpendEntry[],
  ) => { deletionNote: string | null }
  feeMathsNotes: string[]
  updateCost: (sku: string, patch: Partial<ProductCostRow>) => void
  setAdTotalManual: (amount: number) => void
  unlockProDemo: (billingCountry: string) => { ok: boolean; message: string }
  /** Demo: delayed payment failed — delete past-due Free data (v16.4 F8.14 / K11). */
  failDelayedPayment: () => { ok: boolean; message: string }
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
  // Older saves may lack isSample; if flagged as sample data, mark every row (v16.3 E1).
  const legacySample = saved?.usingSampleData === true || saved == null
  const markSampleCosts = (rows: ProductCostRow[]) =>
    legacySample ? rows.map((c) => ({ ...c, isSample: c.isSample ?? true })) : rows
  const markSampleLines = (rows: OrderLine[]) =>
    legacySample ? rows.map((l) => ({ ...l, isSample: l.isSample ?? true })) : rows
  const initialCosts = markSampleCosts(saved?.costs ?? sample.costs.map((c) => ({ ...c, isSample: true })))
  const initialLines = markSampleLines(saved?.lines ?? sample.lines.map((l) => ({ ...l, isSample: true })))
  const initialAds: AdSpendEntry[] = saved?.ads
    ? legacySample
      ? saved.ads.map((a) => ({ ...a, isSample: a.isSample ?? true }))
      : saved.ads
    : [
        {
          id: createId('ad'),
          channel: 'Blended',
          amount: sample.adSpend,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          isSample: true,
        },
      ]
  const [costs, setCosts] = useState<ProductCostRow[]>(initialCosts)
  const [ads, setAds] = useState<AdSpendEntry[]>(initialAds)
  const [lines, setLines] = useState<OrderLine[]>(initialLines)
  const [scenarios, setScenarios] = useState<Scenario[]>(saved?.scenarios ?? defaultScenarios())
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>(saved?.savedDatasets ?? [])
  const [uploadDay, setUploadDay] = useState(
    saved?.uploadDay ?? { dateKey: todayKey(saved?.user?.timeZone ?? 'Europe/London'), used: 0 },
  )
  const [earlyBirdSold, setEarlyBirdSold] = useState(saved?.earlyBirdSold ?? 0)
  const [sampleClearedNotice, setSampleClearedNotice] = useState<string | null>(null)
  const [freeClocks, setFreeClocks] = useState<FreeRetentionClock[]>(
    saved?.plan === 'pro' ? [] : (saved?.freeClocks ?? []),
  )
  const [freeDataDeletedNotice, setFreeDataDeletedNotice] = useState<string | null>(
    saved?.freeDataDeletedNotice ?? null,
  )
  const [keptProData, setKeptProData] = useState<KeptProData | null>(saved?.keptProData ?? null)
  const [paymentPending, setPaymentPending] = useState(saved?.paymentPending ?? false)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [selectedSku, setSelectedSku] = useState<string | null>(
    (saved?.costs ?? sample.costs)[0]?.sku ?? null,
  )

  const usingSampleData =
    lines.some((l) => l.isSample) || costs.some((c) => c.isSample) || ads.some((a) => a.isSample)
  /** Empty starting state: no order lines (after Clear sample / Start fresh). */
  const isEmptyShop = lines.length === 0
  const earliestFreeClock =
    plan === 'free' && !usingSampleData ? earliestClock(freeClocks, nowTick) : null

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
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (plan !== 'free') return
    setFreeClocks((prev) => {
      if (paymentPending) return pauseClocks(prev)
      return resumeOrCancelClocks(prev, { cancel: false })
    })
  }, [paymentPending, plan])

  useEffect(() => {
    if (plan !== 'free' || !freeClocks.length) return
    const expired = freeClocks.filter((c) => isExpired(c, nowTick))
    if (!expired.length) return
    const expiredKinds = new Set(expired.map((c) => c.kind))
    if (expiredKinds.has('orders')) {
      setLines((prev) => prev.filter((l) => l.isSample))
    }
    if (expiredKinds.has('template') || expiredKinds.has('manual')) {
      setCosts((prev) => prev.filter((c) => c.isSample))
      setAds((prev) => prev.filter((a) => a.isSample))
    }
    setFreeClocks((prev) => prev.filter((c) => !isExpired(c, nowTick)))
    setSelectedSku(null)
    setFreeDataDeletedNotice(
      'Your Free data was deleted after 24 hours. Upload again, or upgrade to Pro to keep your data.',
    )
  }, [nowTick, plan, freeClocks])

  useEffect(() => {
    const state: AppPersistedState = {
      version: 5,
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
      usingSampleData,
      freeClocks: plan === 'free' ? freeClocks : [],
      freeDataDeletedNotice,
      keptProData,
      paymentPending,
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
    usingSampleData,
    freeClocks,
    freeDataDeletedNotice,
    keptProData,
    paymentPending,
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
    warnings: result.warnings,
    usingSampleData,
    isEmptyShop,
    sampleClearedNotice,
    dismissSampleClearedNotice: () => setSampleClearedNotice(null),
    freeClocks,
    earliestFreeClock,
    freeDataDeletedNotice,
    dismissFreeDataDeletedNotice: () => setFreeDataDeletedNotice(null),
    keptProData,
    paymentPending,
    setPaymentPending,
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
      // Loading sample is not an upload (v16.3 E1). Only when the shop is empty / sample-only.
      const hasOwn =
        lines.some((l) => !l.isSample) ||
        costs.some((c) => !c.isSample) ||
        ads.some((a) => !a.isSample)
      if (hasOwn) return
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
          isSample: true,
        },
      ])
      setSelectedSku(s.costs[0]?.sku ?? null)
      setSampleClearedNotice(null)
    },
    clearSampleData: () => {
      const counts = countSample(lines, costs, ads)
      if (counts.orderLines + counts.costRows + counts.adRows === 0) return
      const nextLines = lines.filter((l) => !l.isSample)
      const nextCosts = costs.filter((c) => !c.isSample)
      const nextAds = ads.filter((a) => !a.isSample)
      setLines(nextLines)
      setCosts(nextCosts)
      setAds(nextAds)
      setSelectedSku(nextCosts[0]?.sku ?? nextLines[0]?.sku ?? null)
      setSampleClearedNotice(null)
      logDataAction({
        eventType: 'sample data cleared',
        at: new Date().toISOString(),
        accountId: user?.id ?? null,
        plan,
        deleted: {
          orderLines: counts.orderLines,
          costRows: counts.costRows,
          adRows: counts.adRows,
          savedDatasets: 0,
          scenarios: 0,
          overheadsCleared: false,
        },
      })
    },
    startFresh: () => {
      const sampleCounts = countSample(lines, costs, ads)
      const ownLines = lines.filter((l) => !l.isSample).length
      const ownCosts = costs.filter((c) => !c.isSample).length
      const ownAds = ads.filter((a) => !a.isSample).length
      const datasetsN = savedDatasets.length
      const scenariosN = scenarios.length
      setLines([])
      setCosts([])
      setAds([])
      setMonthlyOverheads(0)
      setScenarios([])
      setSavedDatasets([])
      setSelectedSku(null)
      setSampleClearedNotice(null)
      setFreeClocks([])
      setFreeDataDeletedNotice(null)
      setKeptProData(null) // K8 / 15.E: Start fresh also deletes kept ex-Pro data
      // uploadDay intentionally unchanged (v16.3 E4)
      logDataAction({
        eventType: 'start fresh',
        at: new Date().toISOString(),
        accountId: user?.id ?? null,
        plan,
        deleted: {
          orderLines: ownLines + sampleCounts.orderLines,
          costRows: ownCosts + sampleCounts.costRows,
          adRows: ownAds + sampleCounts.adRows,
          savedDatasets: datasetsN,
          scenarios: scenariosN,
          overheadsCleared: monthlyOverheads > 0,
        },
      })
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
    replaceOrders: (next) => {
      const hadSample = usingSampleData
      const counts = countSample(lines, costs, ads)
      setLines(next.map((l) => ({ ...l, isSample: false })))
      if (hadSample) {
        setCosts((prev) => prev.filter((c) => !c.isSample))
        setAds((prev) => prev.filter((a) => !a.isSample))
        setSampleClearedNotice(SAMPLE_CLEARED_NOTE)
        logDataAction({
          eventType: 'sample data cleared (automatic)',
          at: new Date().toISOString(),
          accountId: user?.id ?? null,
          plan,
          deleted: {
            orderLines: counts.orderLines,
            costRows: counts.costRows,
            adRows: counts.adRows,
            savedDatasets: 0,
            scenarios: 0,
            overheadsCleared: false,
          },
        })
      }
    },
    importPlatformOrders: (input) => {
      if (!user?.emailVerified) {
        setAuthOpen(true)
        return { ok: false, message: 'Verify your email before your first upload.' }
      }
      if (plan === 'free' && uploadsLeft <= 0) {
        setUpgradeOpen(true)
        return { ok: false, message: en.uploadsExhausted }
      }
      const parsed = importPlatformFiles(input)
      if (!parsed.ok) {
        // Failed upload leaves sample data in place (v16.3 E9)
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
      const hadSample = usingSampleData
      const counts = countSample(lines, costs, ads)
      const ownLines = parsed.lines.map((l) => ({ ...l, isSample: false as const }))
      setLines(ownLines)
      setFreeDataDeletedNotice(null)
      const nextClocks = plan === 'free' ? upsertClock(freeClocks, 'orders') : freeClocks
      if (plan === 'free') setFreeClocks(nextClocks)
      const ordersClock = nextClocks.find((c) => c.kind === 'orders') ?? null
      if (hadSample) {
        setCosts((prev) => prev.filter((c) => !c.isSample))
        setAds((prev) => {
          const kept = prev.filter((a) => !a.isSample)
          if (parsed.ads.length && plan === 'pro') return [...parsed.ads, ...kept]
          return kept
        })
        setSampleClearedNotice(SAMPLE_CLEARED_NOTE)
        logDataAction({
          eventType: 'sample data cleared (automatic)',
          at: new Date().toISOString(),
          accountId: user?.id ?? null,
          plan,
          deleted: {
            orderLines: counts.orderLines,
            costRows: counts.costRows,
            adRows: counts.adRows,
            savedDatasets: 0,
            scenarios: 0,
            overheadsCleared: false,
          },
        })
      } else if (parsed.ads.length) {
        setAds((prev) => (plan === 'pro' ? [...parsed.ads, ...prev] : prev))
      }
      setSelectedSku(ownLines[0]?.sku ?? null)
      // Raw file never stored after import (v16.4 F5)
      const deletionNote =
        plan === 'free' && ordersClock
          ? `Free data deleted ${formatDeletionTime(ordersClock.expiresAt, tz)} (${tz}).`
          : plan === 'free'
            ? 'Free uploads are deleted after 24 hours.'
            : null
      const msg = [
        `Imported ${parsed.summary.newRows ?? parsed.lines.length} lines.`,
        'Original file deleted after import.',
        deletionNote,
        hadSample ? SAMPLE_CLEARED_NOTE : null,
        ...parsed.warnings.slice(0, 3),
        ...parsed.mathsNotes.slice(0, 2),
      ]
        .filter(Boolean)
        .join(' ')
      return { ok: true, message: msg }
    },
    replaceTemplate: (nextCosts, nextAds) => {
      const hadSample = usingSampleData
      const counts = countSample(lines, costs, ads)
      const ownCosts = nextCosts.map((c) => ({ ...c, isSample: false as const }))
      setCosts(ownCosts)
      setFreeDataDeletedNotice(null)
      // v16.4 F2 / F8.5 — same deletion-time notice as orders import
      const nextClocks = plan === 'free' ? upsertClock(freeClocks, 'template') : freeClocks
      if (plan === 'free') setFreeClocks(nextClocks)
      const templateClock = nextClocks.find((c) => c.kind === 'template') ?? null
      if (hadSample) {
        setLines((prev) => prev.filter((l) => !l.isSample))
        if (nextAds) {
          setAds(nextAds.map((a) => ({ ...a, isSample: false as const })))
        } else {
          setAds((prev) => prev.filter((a) => !a.isSample))
        }
        setSampleClearedNotice(SAMPLE_CLEARED_NOTE)
        logDataAction({
          eventType: 'sample data cleared (automatic)',
          at: new Date().toISOString(),
          accountId: user?.id ?? null,
          plan,
          deleted: {
            orderLines: counts.orderLines,
            costRows: counts.costRows,
            adRows: counts.adRows,
            savedDatasets: 0,
            scenarios: 0,
            overheadsCleared: false,
          },
        })
      } else if (nextAds) {
        setAds(nextAds.map((a) => ({ ...a, isSample: false as const })))
      }
      setSelectedSku(ownCosts[0]?.sku ?? null)
      const deletionNote =
        plan === 'free' && templateClock
          ? `Free data deleted ${formatDeletionTime(templateClock.expiresAt, tz)} (${tz}).`
          : plan === 'free'
            ? 'Free uploads are deleted after 24 hours.'
            : null
      return { deletionNote }
    },
    failDelayedPayment: () => {
      if (plan !== 'free') {
        setPaymentPending(false)
        return { ok: true, message: 'Payment pending cleared.' }
      }
      const now = Date.now()
      const { keep, expiredKinds } = applyPaymentFailure(freeClocks, now)
      setPaymentPending(false)
      if (expiredKinds.includes('orders')) {
        setLines((prev) => prev.filter((l) => l.isSample))
      }
      if (expiredKinds.includes('template') || expiredKinds.includes('manual')) {
        setCosts((prev) => prev.filter((c) => c.isSample))
        setAds((prev) => prev.filter((a) => a.isSample))
      }
      setFreeClocks(keep)
      if (expiredKinds.length) {
        setSelectedSku(null)
        setFreeDataDeletedNotice(
          'Your Free data was deleted because payment failed after the 24-hour window. Upload again, or upgrade to Pro.',
        )
        return { ok: true, message: en.paymentFailedPastDueDeleted }
      }
      return { ok: true, message: en.paymentFailedClocksResumed }
    },
    updateCost: (sku, patch) => {
      setCosts((prev) => {
        const row = prev.find((c) => c.sku === sku)
        // First save of a non-sample manual edit starts a Free manual clock (F1)
        if (plan === 'free' && row && !row.isSample) {
          setFreeClocks((clocks) =>
            clocks.some((c) => c.kind === 'manual') ? clocks : upsertClock(clocks, 'manual'),
          )
        }
        return prev.map((c) => (c.sku === sku ? { ...c, ...patch } : c))
      })
      // K2: digital is manual — sync requiresShipping on matching order lines
      if (typeof patch.digital === 'boolean') {
        setLines((prev) =>
          prev.map((l) =>
            l.sku === sku
              ? {
                  ...l,
                  requiresShipping: !patch.digital,
                  shippingCost: patch.digital ? 0 : l.shippingCost,
                }
              : l,
          ),
        )
      }
    },
    setAdTotalManual: (amount) => {
      if (plan === 'free') {
        setFreeClocks((clocks) =>
          clocks.some((c) => c.kind === 'manual') ? clocks : upsertClock(clocks, 'manual'),
        )
      }
      setAds([
        {
          id: createId('ad'),
          channel: plan === 'pro' ? 'Meta' : 'Blended',
          amount,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          isSample: false,
        },
      ])
    },
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
        paymentPending,
        earlyBirdSold,
      })
      if (res.ok) {
        setPlan('pro')
        if (res.earlyBirdSold != null) setEarlyBirdSold(res.earlyBirdSold)
        setPaymentPending(false)
        // F7: upgrading cancels every running 24-hour clock
        setFreeClocks([])
        setFreeDataDeletedNotice(null)
        // K8: restore kept ex-Pro data if present
        if (keptProData) {
          setLines(keptProData.lines)
          setCosts(keptProData.costs)
          setAds(keptProData.ads)
          setSavedDatasets(keptProData.savedDatasets)
          setScenarios(keptProData.scenarios)
          setMonthlyOverheads(keptProData.monthlyOverheads)
          setKeptProData(null)
        } else if (lines.some((l) => !l.isSample)) {
          // Free dataset still within 24h carries into Pro shop
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
        }
        setUpgradeOpen(false)
      }
      return { ok: res.ok, message: res.message }
    },
    switchToFree: () => {
      // Demo stand-in for refunded Pro (K8): keep shop for CSV export only
      const ownLines = lines.filter((l) => !l.isSample)
      const ownCosts = costs.filter((c) => !c.isSample)
      const ownAds = ads.filter((a) => !a.isSample)
      if (ownLines.length || ownCosts.length || savedDatasets.length) {
        setKeptProData({
          lines: ownLines,
          costs: ownCosts,
          ads: ownAds,
          savedDatasets,
          scenarios,
          monthlyOverheads,
          keptAt: new Date().toISOString(),
        })
      }
      setLines([])
      setCosts([])
      setAds([])
      setSavedDatasets([])
      setScenarios([])
      setMonthlyOverheads(0)
      setSelectedSku(null)
      setFreeClocks([])
      setPlan('free')
    },
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
      // Cleaned rows only — never the original file (v16.4 F3 / F5).
      // K8: ex-Pro kept data is exportable from settings when results are empty.
      const sourceLines = lines.length ? lines : (keptProData?.lines ?? [])
      const sourceCosts = costs.length ? costs : (keptProData?.costs ?? [])
      if (result.products.length) {
        const header = 'sku,name,revenue,net_profit,net_margin_pct,verdict'
        const rows = result.products.map(
          (p) =>
            `${p.sku},"${p.name}",${p.revenue},${p.netProfit},${p.netMarginPct},${p.verdict}`,
        )
        return [header, ...rows].join('\n')
      }
      const costHeader = 'sku,name,unit_cost,packaging_cost,shipping_cost_per_unit,return_cost_per_returned_unit'
      const costRows = sourceCosts.map(
        (c) =>
          `${c.sku},"${c.name}",${c.unitCost},${c.packagingCost},${c.shippingCostPerUnit},${c.returnCostPerReturnedUnit}`,
      )
      const orderHeader = 'order_id,sku,name,quantity,line_value,platform,order_date'
      const orderRows = sourceLines.map(
        (l) =>
          `${l.orderId},${l.sku},"${l.name}",${l.quantity},${l.lineValue},${l.platform},${l.orderDate}`,
      )
      return [
        '# costs',
        costHeader,
        ...costRows,
        '# orders',
        orderHeader,
        ...orderRows,
      ].join('\n')
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
