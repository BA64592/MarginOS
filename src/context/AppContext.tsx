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
import { marginosAuthProvider } from '../lib/auth/provider'
import {
  EARLY_BIRD_CAP,
  foundingPlacesLeft,
  startCheckout,
} from '../lib/payments/provider'
import { logDataAction } from '../lib/auditLog'
import { en } from '../i18n/en'
import { inactivityWarningDays, isInactive24Months } from '../lib/inactivity'
import {
  applyPaymentFailure,
  earliestClock,
  isExpired,
  pauseClocks,
  resumeOrCancelClocks,
} from '../lib/retention'
import { buildDemoStore, type DemoStoreId } from '../lib/demo/stores'
import { clearAllState, loadState, saveState } from '../lib/storage'
import { evaluateOrderImport, uniqueOrderIds } from '../lib/orders/uniqueOrders'
import {
  FOUNDING_CAP,
  PLANS,
  TRIAL_DAYS,
  hasFeature,
  hasPaidAccess,
  nextPlanAfter,
  orderLimitFor,
  type AccessKind,
  type BillingInterval,
  type PlanFeature,
  type PlanId,
} from '../lib/plans'
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

type AppRoute = 'app' | 'pricing' | 'home' | 'legal'

function normalizePlan(raw: Plan | 'free' | undefined | null): Plan {
  if (!raw || raw === 'free') return 'none'
  return raw
}

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
  access: AccessKind
  billingInterval: BillingInterval | null
  trialEndsAt: string | null
  accessEndsAt: string | null
  foundingSold: number
  foundingLeft: number
  foundingEligible: boolean
  trialUsed: boolean
  theme: 'light'
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
  /** @deprecated v17 — stub mapped to foundingSold. */
  earlyBirdSold: number
  /** @deprecated v17 — stub mapped to foundingLeft. */
  earlyBirdLeft: number
  usageUniqueOrderIds: string[]
  usageUniqueOrderCount: number
  orderLimit: number | null
  route: AppRoute
  setRoute: (r: AppRoute) => void
  hasFeature: (feature: PlanFeature) => boolean
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
  /** @deprecated v17 Free 24h clocks — retired by K39. */
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
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; message: string }>
  signInGoogle: (emailVerified: boolean) => void
  verifyEmail: () => void
  requestVerificationEmail: () => Promise<{ ok: boolean; message: string; debugToken?: string }>
  applyVerifyToken: (token: string) => Promise<{ ok: boolean; message: string }>
  signOut: () => void
  loadSample: () => void
  /** Marketing soft-launch demo shops (synthetic only). */
  loadDemoStore: (id: DemoStoreId) => void
  /** Remove sample rows only — never uses a Free upload (v16.3 E2). */
  clearSampleData: () => void
  /** Delete all shop data; keep account, subscription and settings (v16.3 E3). */
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
  unlockProDemo: (
    billingCountry: string,
    planId?: PlanId,
    interval?: BillingInterval,
  ) => Promise<{ ok: boolean; message: string }>
  /** Demo: delayed payment failed — delete past-due Free data (v16.4 F8.14 / K11). */
  failDelayedPayment: () => { ok: boolean; message: string }
  /** Demo harness: end subscription access (plan/access → none). */
  switchToFree: () => void
  /** §10.2.8 — delete account and all local shop data. */
  deleteAccount: (confirmEmail: string) => { ok: boolean; message: string }
  inactivityNotice: string | null
  dismissInactivityNotice: () => void
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

  const initialPlan = normalizePlan(saved?.plan as Plan | 'free' | undefined)
  const initialAccess: AccessKind =
    saved?.access ??
    (initialPlan === 'legacy' ? 'legacy' : initialPlan === 'none' ? 'none' : 'active')

  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [access, setAccess] = useState<AccessKind>(initialAccess)
  const [billingInterval, setBillingInterval] = useState<BillingInterval | null>(
    saved?.billingInterval ?? null,
  )
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(saved?.trialEndsAt ?? null)
  const [accessEndsAt, setAccessEndsAt] = useState<string | null>(saved?.accessEndsAt ?? null)
  const [foundingSold, setFoundingSold] = useState(
    saved?.foundingSold ?? saved?.earlyBirdSold ?? 0,
  )
  const [foundingEligible] = useState(saved?.foundingEligible ?? true)
  const [trialUsed, setTrialUsed] = useState(saved?.trialUsed ?? false)
  const [theme] = useState<'light'>('light')
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
  const [usageMonthKey, setUsageMonthKey] = useState(saved?.usageMonthKey ?? '')
  const [usageUniqueOrderIds, setUsageUniqueOrderIds] = useState<string[]>(
    saved?.usageUniqueOrderIds ?? [],
  )
  const [route, setRoute] = useState<AppRoute>('app')
  const [sampleClearedNotice, setSampleClearedNotice] = useState<string | null>(null)
  const [freeClocks, setFreeClocks] = useState<FreeRetentionClock[]>(
    hasPaidAccess(initialAccess) ? [] : (saved?.freeClocks ?? []),
  )
  const [freeDataDeletedNotice, setFreeDataDeletedNotice] = useState<string | null>(
    saved?.freeDataDeletedNotice ?? null,
  )
  const [keptProData, setKeptProData] = useState<KeptProData | null>(saved?.keptProData ?? null)
  const [paymentPending, setPaymentPending] = useState(saved?.paymentPending ?? false)
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null)
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
    access === 'none' && !usingSampleData ? earliestClock(freeClocks, nowTick) : null

  const tz = user?.timeZone ?? 'Europe/London'
  const dayKey = todayKey(tz)
  const currentMonthKey = dayKey.slice(0, 7)
  useEffect(() => {
    if (uploadDay.dateKey !== dayKey) setUploadDay({ dateKey: dayKey, used: 0 })
  }, [dayKey, uploadDay.dateKey])

  useEffect(() => {
    if (usageMonthKey !== currentMonthKey) {
      setUsageMonthKey(currentMonthKey)
      setUsageUniqueOrderIds([])
    }
  }, [currentMonthKey, usageMonthKey])

  // Subscribed → unlimited uploads; no plan → 0 real uploads (sample load still OK).
  const uploadsLeft = hasPaidAccess(access) ? 999 : 0
  const foundingLeft = foundingPlacesLeft(foundingSold)
  const orderLimit = orderLimitFor(plan)

  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (hasPaidAccess(access)) return
    setFreeClocks((prev) => {
      if (paymentPending) return pauseClocks(prev)
      return resumeOrCancelClocks(prev, { cancel: false })
    })
  }, [paymentPending, access])

  useEffect(() => {
    if (hasPaidAccess(access) || !freeClocks.length) return
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
      'Your data was deleted after 24 hours. Upload again, or start a trial to keep your data.',
    )
  }, [nowTick, access, freeClocks])

  // K8 / F9 — 24-month inactivity deletes uploaded order data (and kept ex-Pro orders)
  useEffect(() => {
    if (!user) return
    const anchor = user.lastSignInAt
    if (isInactive24Months(anchor, nowTick)) {
      setLines((prev) => prev.filter((l) => l.isSample))
      setKeptProData((prev) =>
        prev
          ? {
              ...prev,
              lines: [],
              costs: prev.costs,
              ads: [],
              savedDatasets: [],
              scenarios: [],
            }
          : prev,
      )
      setFreeClocks([])
      setInactivityNotice(
        'Order data was deleted after 24 months of inactivity. Your account and settings remain.',
      )
      return
    }
    const warn = inactivityWarningDays(anchor, nowTick)
    if (warn) {
      setInactivityNotice(
        `Your uploaded order data will be deleted in about ${warn} days under the 24-month inactivity rule. Sign in again or export your data.`,
      )
    }
  }, [user, nowTick])

  const applyLegacyFromSession = () => {
    // Server still sends plan=pro for lifetime licences → map to legacy access (v18).
    setPlan('legacy')
    setAccess('legacy')
    setFreeClocks([])
  }

  // Restore server session (verified email + licence) across devices / sign-ins
  useEffect(() => {
    void marginosAuthProvider.fetchSession().then(async (session) => {
      if (!session) return
      let current = session
      if (current.plan !== 'pro') {
        const sync = await marginosAuthProvider.syncLicence()
        if (sync.ok && sync.session) current = sync.session
      }
      const tzGuess = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
      setUser({
        id: current.accountId,
        email: current.email,
        emailVerified: current.emailVerified,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        lastSignInAt: new Date().toISOString(),
        timeZone: tzGuess,
        timeZoneChangedAt: null,
      })
      if (current.plan === 'pro') applyLegacyFromSession()
    })
  }, [])

  // Email verification + Stripe return deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('verify')
    if (token) {
      void marginosAuthProvider.verifyEmail(token).then((res) => {
        if (res.ok) {
          setUser((u) => {
            if (u) {
              return { ...u, emailVerified: true, lastSignInAt: new Date().toISOString() }
            }
            if (res.session) {
              return {
                id: res.session.accountId,
                email: res.session.email,
                emailVerified: true,
                authProvider: 'email',
                createdAt: new Date().toISOString(),
                lastSignInAt: new Date().toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
                timeZoneChangedAt: null,
              }
            }
            return u
          })
          if (res.session?.plan === 'pro') applyLegacyFromSession()
        }
        params.delete('verify')
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
        window.history.replaceState({}, '', next)
      })
    }
    if (params.get('verified') === '1') {
      void marginosAuthProvider.fetchSession().then((session) => {
        if (!session) return
        setUser({
          id: session.accountId,
          email: session.email,
          emailVerified: session.emailVerified,
          authProvider: 'email',
          createdAt: new Date().toISOString(),
          lastSignInAt: new Date().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
          timeZoneChangedAt: null,
        })
        if (session.plan === 'pro') applyLegacyFromSession()
      })
      params.delete('verified')
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next)
    }
    if (params.get('checkout') === 'success') {
      setAccess('trial')
      setTrialUsed(true)
      setPaymentPending(false)
      setFreeClocks([])
      // Refresh licence from server (Stripe webhook may have written plan)
      void marginosAuthProvider.fetchSession().then((session) => {
        if (session?.plan === 'pro') applyLegacyFromSession()
        if (session) {
          setUser((u) =>
            u
              ? { ...u, emailVerified: session.emailVerified, id: session.accountId, email: session.email }
              : u,
          )
        }
      })
      params.delete('checkout')
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next)
    }
  }, [])

  useEffect(() => {
    const state: AppPersistedState = {
      version: 6,
      plan,
      access,
      billingInterval,
      trialEndsAt,
      accessEndsAt,
      foundingEligible,
      foundingSold,
      theme: 'light',
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
      usageMonthKey,
      usageUniqueOrderIds,
      uploadDay,
      earlyBirdSold: foundingSold,
      licenceActive: hasPaidAccess(access),
      digitalListingSkus: costs.filter((c) => c.digital).map((c) => c.sku),
      usingSampleData,
      freeClocks: hasPaidAccess(access) ? [] : freeClocks,
      freeDataDeletedNotice,
      keptProData,
      paymentPending,
      trialUsed,
    }
    saveState(state)
  }, [
    plan,
    access,
    billingInterval,
    trialEndsAt,
    accessEndsAt,
    foundingEligible,
    foundingSold,
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
    usageMonthKey,
    usageUniqueOrderIds,
    uploadDay,
    usingSampleData,
    freeClocks,
    freeDataDeletedNotice,
    keptProData,
    paymentPending,
    trialUsed,
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

  const result = useMemo(() => {
    // Full diagnosis for every tier + sample (v18 — no sanitizeResultForFree).
    return analyzeStore({
      lines,
      costs,
      adSpendTotal,
      overheadsForPeriod: hasFeature(plan, 'overheads') ? overheadsForPeriod : 0,
      conversionFees: 0,
      currency,
      targetMarginPct,
      feesComparable: feeCmp.comparable,
      feesExcessPp: feeCmp.excessPp,
    })
  }, [lines, costs, adSpendTotal, overheadsForPeriod, currency, targetMarginPct, feeCmp, plan])

  const scenarioResults = useMemo(() => {
    if (!hasFeature(plan, 'scenarios')) return []
    return scenarios.map((scenario) => {
      const applied = applyScenarioToLines(lines, costs, adSpendTotal, scenario.adjustments)
      return {
        scenario,
        result: analyzeStore({
          lines: applied.lines,
          costs: applied.costs,
          adSpendTotal: applied.adSpend,
          overheadsForPeriod: hasFeature(plan, 'overheads') ? overheadsForPeriod : 0,
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
    access,
    billingInterval,
    trialEndsAt,
    accessEndsAt,
    foundingSold,
    foundingLeft,
    foundingEligible,
    trialUsed,
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
    uploadsLeft,
    earlyBirdSold: foundingSold,
    earlyBirdLeft: foundingLeft,
    usageUniqueOrderIds,
    usageUniqueOrderCount: usageUniqueOrderIds.length,
    orderLimit,
    route,
    setRoute,
    hasFeature: (feature) => hasFeature(plan, feature),
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
    inactivityNotice,
    dismissInactivityNotice: () => setInactivityNotice(null),
    keptProData,
    paymentPending,
    setPaymentPending,
    setUpgradeOpen,
    setAuthOpen,
    setSelectedSku,
    toggleTheme: () => {
      document.documentElement.classList.remove('dark')
    },
    setCurrency,
    setTax: (patch) => setTaxState((t) => ({ ...t, ...patch })),
    setTargetMarginPct,
    setMonthlyOverheads,
    signInEmail: async (email, password) => {
      const res = await marginosAuthProvider.signInEmail(email, password)
      if (!res.ok || !res.session) {
        return { ok: false, message: res.message || 'Sign-in failed.' }
      }
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
      if (res.session.plan === 'pro') {
        applyLegacyFromSession()
      } else {
        // Restore lifetime licence from a prior Stripe purchase tied to this email
        void marginosAuthProvider.syncLicence().then((sync) => {
          if (sync.ok && sync.session?.plan === 'pro') {
            applyLegacyFromSession()
            setUser((u) =>
              u
                ? { ...u, emailVerified: sync.session!.emailVerified, id: sync.session!.accountId }
                : u,
            )
          }
        })
      }
      setAuthOpen(false)
      return { ok: true, message: res.message || 'Signed in.' }
    },
    signInGoogle: (emailVerified) => {
      void marginosAuthProvider
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
      if (!user) return
      void marginosAuthProvider.requestEmailVerification(user.id, user.email).then((res) => {
        if (res.debugToken) {
          void marginosAuthProvider.verifyEmail(res.debugToken).then((v) => {
            if (v.ok) setUser((u) => (u ? { ...u, emailVerified: true } : u))
          })
          return
        }
        // Strict / SES path: wait for ?verify= link
      })
    },
    requestVerificationEmail: async () => {
      if (!user) return { ok: false, message: 'Sign in first.' }
      return marginosAuthProvider.requestEmailVerification(user.id, user.email)
    },
    applyVerifyToken: async (token) => {
      const res = await marginosAuthProvider.verifyEmail(token)
      if (res.ok) {
        setUser((u) => {
          const base = u
            ? { ...u, emailVerified: true }
            : res.session
              ? {
                  id: res.session.accountId,
                  email: res.session.email,
                  emailVerified: true,
                  authProvider: 'email' as const,
                  createdAt: new Date().toISOString(),
                  lastSignInAt: new Date().toISOString(),
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London',
                  timeZoneChangedAt: null,
                }
              : null
          return base
        })
        if (res.session?.plan === 'pro') applyLegacyFromSession()
      }
      return res
    },
    signOut: () => {
      void marginosAuthProvider.signOut()
      setUser(null)
    },
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
    loadDemoStore: (id) => {
      const hasOwn =
        lines.some((l) => !l.isSample) ||
        costs.some((c) => !c.isSample) ||
        ads.some((a) => !a.isSample)
      if (hasOwn) return
      const s = buildDemoStore(id, currency)
      setLines(s.lines)
      setCosts(s.costs)
      setAds(s.ads)
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
      if (!user?.emailVerified) {
        setAuthOpen(true)
        return false
      }
      if (!hasPaidAccess(access)) {
        setUpgradeOpen(true)
        return false
      }
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
      if (!hasPaidAccess(access)) {
        setUpgradeOpen(true)
        return { ok: false, message: en.verifyEmail || 'Start a trial to upload your own orders.' }
      }
      const parsed = importPlatformFiles(input)
      if (!parsed.ok) {
        // Failed upload leaves sample data in place (v16.3 E9)
        return { ok: false, message: parsed.errors.join(' ') || 'Import failed.' }
      }
      const limit = orderLimitFor(plan)
      if (hasPaidAccess(access) && limit != null) {
        const existingForUsage =
          usageUniqueOrderIds.length > 0
            ? usageUniqueOrderIds.map((orderId) => ({ orderId, isSample: false }) as OrderLine)
            : lines
        const check = evaluateOrderImport({
          existing: existingForUsage,
          incoming: parsed.lines,
          limit,
        })
        if (!check.allowed) {
          const tier: PlanId =
            plan === 'legacy' ? 'pro' : plan === 'none' ? 'starter' : plan
          const next = nextPlanAfter(tier)
          return {
            ok: false,
            message: en.orderLimitBlocked(
              check.newUnique,
              check.projected,
              check.overage,
              next ? PLANS[next].name : 'a higher plan',
            ),
          }
        }
      }
      const hadSample = usingSampleData
      const counts = countSample(lines, costs, ads)
      const ownLines = parsed.lines.map((l) => ({ ...l, isSample: false as const }))
      const incomingIds = [...uniqueOrderIds(ownLines)]
      setUsageUniqueOrderIds((prev) => [...new Set([...prev, ...incomingIds])])
      setLines(ownLines)
      setFreeDataDeletedNotice(null)
      setFreeClocks([])
      if (hadSample) {
        setCosts((prev) => prev.filter((c) => !c.isSample))
        setAds((prev) => {
          const kept = prev.filter((a) => !a.isSample)
          if (parsed.ads.length && hasPaidAccess(access)) return [...parsed.ads, ...kept]
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
        setAds((prev) => (hasPaidAccess(access) ? [...parsed.ads, ...prev] : prev))
      }
      setSelectedSku(ownLines[0]?.sku ?? null)
      // Raw file never stored after import (v16.4 F5)
      const msg = [
        `Imported ${parsed.summary.newRows ?? parsed.lines.length} lines.`,
        'Original file deleted after import.',
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
      return { deletionNote: null }
    },
    failDelayedPayment: () => {
      if (hasPaidAccess(access)) {
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
      setCosts((prev) => prev.map((c) => (c.sku === sku ? { ...c, ...patch } : c)))
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
      setAds([
        {
          id: createId('ad'),
          channel: hasFeature(plan, 'perChannelRoas') ? 'Meta' : 'Blended',
          amount,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          isSample: false,
        },
      ])
    },
    unlockProDemo: async (billingCountry, planId = 'growth', interval = 'month') => {
      if (!user) {
        setAuthOpen(true)
        return { ok: false, message: 'Sign in to start a trial.' }
      }
      const res = await startCheckout({
        accountId: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        billingCountry,
        currency,
        planId,
        interval,
        foundingSold,
        trialUsed,
        alreadySubscribed: hasPaidAccess(access),
        paymentPending,
      })
      if (res.checkoutUrl) {
        window.location.assign(res.checkoutUrl)
        return res
      }
      if (res.ok) {
        const lic = res.licence
        setPlan(lic?.planId ?? planId)
        setAccess('trial')
        setBillingInterval(lic?.interval ?? interval)
        setTrialEndsAt(
          lic?.trialEndsAt ??
            new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        )
        setTrialUsed(true)
        if (res.foundingSold != null) setFoundingSold(res.foundingSold)
        else if (lic?.founding) setFoundingSold((n) => Math.min(FOUNDING_CAP, n + 1))
        setPaymentPending(false)
        setFreeClocks([])
        setFreeDataDeletedNotice(null)
        // K8: restore kept ex-subscriber data if present
        if (keptProData) {
          setLines(keptProData.lines)
          setCosts(keptProData.costs)
          setAds(keptProData.ads)
          setSavedDatasets(keptProData.savedDatasets)
          setScenarios(keptProData.scenarios)
          setMonthlyOverheads(keptProData.monthlyOverheads)
          setKeptProData(null)
        } else if (lines.some((l) => !l.isSample)) {
          setSavedDatasets((prev) => [
            {
              id: createId('ds'),
              name: 'Upgraded from sample',
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
      // Demo harness: end access — keep shop snapshot for CSV export only
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
      setPlan('none')
      setAccess('none')
      setBillingInterval(null)
      setTrialEndsAt(null)
      setAccessEndsAt(null)
    },
    deleteAccount: (confirmEmail) => {
      if (!user) return { ok: false, message: 'Sign in first.' }
      if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        return { ok: false, message: 'Type your account email to confirm deletion.' }
      }
      logDataAction({
        eventType: 'account deleted',
        at: new Date().toISOString(),
        accountId: user.id,
        plan,
        deleted: {
          orderLines: lines.length,
          costRows: costs.length,
          adRows: ads.length,
          savedDatasets: savedDatasets.length,
          scenarios: scenarios.length,
          overheadsCleared: monthlyOverheads > 0,
        },
      })
      clearAllState()
      setUser(null)
      setPlan('none')
      setAccess('none')
      setBillingInterval(null)
      setTrialEndsAt(null)
      setAccessEndsAt(null)
      setUsageUniqueOrderIds([])
      setLines([])
      setCosts([])
      setAds([])
      setScenarios(defaultScenarios())
      setSavedDatasets([])
      setMonthlyOverheads(0)
      setKeptProData(null)
      setFreeClocks([])
      setFreeDataDeletedNotice(null)
      setPaymentPending(false)
      setSelectedSku(null)
      setAuthOpen(false)
      return { ok: true, message: 'Account deleted from this browser. This cannot be undone.' }
    },
    createScenario: () => {
      if (!hasFeature(plan, 'scenarios')) {
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
      if (!hasPaidAccess(access)) {
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
