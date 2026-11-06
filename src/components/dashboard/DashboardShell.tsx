import {
  Calculator,
  GitCompareArrows,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Package,
  Settings,
  Upload,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useApp } from '../../context/AppContext'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import { cn } from '../../lib/cn'
import { platformLabel } from '../../lib/platforms'
import type { Platform } from '../../lib/types'
import { BrandLockup } from '../BrandMark'
import { Header } from '../Header'
import { Badge, Button } from '../ui'

export type DashSection =
  | 'overview'
  | 'workspace'
  | 'leaks'
  | 'charts'
  | 'calculators'
  | 'scenarios'
  | 'settings'

export const DASH_SECTIONS: { id: DashSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspace', label: 'Upload', icon: Upload },
  { id: 'leaks', label: 'Leaks', icon: ListOrdered },
  { id: 'charts', label: 'Charts', icon: LineChart },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
  { id: 'scenarios', label: 'Scenarios', icon: GitCompareArrows },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function dashDomId(id: DashSection) {
  return `dash-${id}`
}

type FilterContextValue = {
  platforms: Platform[]
  selected: Set<Platform>
  togglePlatform: (p: Platform) => void
  selectAll: () => void
  allSelected: boolean
  section: DashSection
  setSection: (s: DashSection) => void
  scrollToSection: (s: DashSection) => void
}

const DashboardFilterContext = createContext<FilterContextValue | null>(null)

export function useDashboardFilters() {
  return useContext(DashboardFilterContext)
}

function FilterBar() {
  const { result, usingSampleData, isEmptyShop, currency } = useApp()
  const filters = useDashboardFilters()
  if (!filters) return null

  const period = result.totals.period

  return (
    <div className="border-b border-border/80 bg-bg/95 backdrop-blur-xl">
      <div className="flex flex-col gap-3 px-4 py-2.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Period</p>
          {isEmptyShop ? (
            <span className="text-sm text-subtle">Upload orders to set the range</span>
          ) : (
            <span className="rounded-[10px] border border-border bg-elevated px-2.5 py-1 text-sm text-ink">
              {period.start} → {period.end}
              <span className="text-subtle">
                {' '}
                · {period.days}d · {currency}
              </span>
            </span>
          )}
          {usingSampleData ? <Badge tone="warn">Sample</Badge> : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="Platform filter">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Platform</p>
          <button
            type="button"
            onClick={filters.selectAll}
            className={cn(
              'min-h-9 rounded-[10px] border px-2.5 text-xs font-semibold transition',
              filters.allSelected
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-elevated text-subtle hover:text-ink',
            )}
          >
            All
          </button>
          {filters.platforms.map((p) => {
            const on = filters.selected.has(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => filters.togglePlatform(p)}
                className={cn(
                  'min-h-9 rounded-[10px] border px-2.5 text-xs font-semibold transition',
                  on
                    ? 'border-navy/30 bg-navy text-white dark:bg-white dark:text-[#061F45]'
                    : 'border-border bg-elevated text-subtle hover:text-ink',
                )}
              >
                {platformLabel(p)}
              </button>
            )
          })}
          {filters.platforms.length === 0 ? (
            <span className="text-xs text-subtle">No platforms yet</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean
  onClose: () => void
}) {
  const filters = useDashboardFilters()
  const { setRoute } = useApp()
  if (!filters) return null

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Control room">
      {DASH_SECTIONS.map((item) => {
        const active = filters.section === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              filters.scrollToSection(item.id)
              onClose()
            }}
            className={cn(
              'inline-flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition',
              active
                ? 'bg-accent-soft text-accent shadow-[inset_3px_0_0_0_var(--accent)]'
                : 'text-subtle opacity-80 hover:bg-muted hover:text-ink hover:opacity-100',
            )}
          >
            <item.icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-70')} />
            {item.label}
          </button>
        )
      })}
      <div className="my-2 border-t border-border" />
      <button
        type="button"
        onClick={() => setRoute('pricing')}
        className="inline-flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-subtle opacity-80 hover:bg-muted hover:text-ink hover:opacity-100"
      >
        <Package className="h-4 w-4 shrink-0" />
        Plans
      </button>
    </nav>
  )

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-border bg-elevated lg:block">
        <div className="sticky top-0 flex max-h-screen flex-col overflow-y-auto">
          <div className="border-b border-border px-4 py-4">
            <BrandLockup />
            <p className="mt-1 text-xs text-subtle">Control room</p>
          </div>
          {nav}
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Close navigation"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-elevated shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <BrandLockup />
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { lines, platformFilter, setPlatformFilter } = useApp()
  const [section, setSection] = useState<DashSection>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Platforms from all loaded lines (not the filtered analysis) so chips stay available.
  const platforms = useMemo(() => {
    const set = new Set<Platform>()
    for (const line of lines) set.add(line.platform)
    return [...set]
  }, [lines])

  const [selected, setSelected] = useState<Set<Platform>>(() => new Set())

  const effectiveSelected = useMemo(() => {
    if (platforms.length === 0) return new Set<Platform>()
    if (selected.size === 0) return new Set(platforms)
    const next = new Set([...selected].filter((p) => platforms.includes(p)))
    return next.size === 0 ? new Set(platforms) : next
  }, [platforms, selected])

  // Drive AppContext analysis from the same chips (BUG-020).
  useEffect(() => {
    if (platforms.length === 0) {
      if (platformFilter) setPlatformFilter(null)
      return
    }
    const allOn = platforms.every((p) => effectiveSelected.has(p))
    if (allOn) {
      if (platformFilter) setPlatformFilter(null)
    } else {
      const same =
        platformFilter &&
        platformFilter.size === effectiveSelected.size &&
        [...effectiveSelected].every((p) => platformFilter.has(p))
      if (!same) setPlatformFilter(new Set(effectiveSelected))
    }
  }, [effectiveSelected, platforms, platformFilter, setPlatformFilter])

  const sectionDomIds = useMemo(() => DASH_SECTIONS.map((s) => dashDomId(s.id)), [])

  const onSpyActive = useCallback((domId: string) => {
    const id = domId.replace(/^dash-/, '') as DashSection
    if (DASH_SECTIONS.some((s) => s.id === id)) setSection(id)
  }, [])

  const { scrollToSection: scrollDom } = useScrollSpy(sectionDomIds, onSpyActive, {
    headerOffsetPx: 128,
  })

  const scrollToSection = useCallback(
    (s: DashSection) => {
      setSection(s)
      scrollDom(dashDomId(s))
    },
    [scrollDom],
  )

  const value = useMemo<FilterContextValue>(
    () => ({
      platforms,
      selected: effectiveSelected,
      allSelected: platforms.length > 0 && platforms.every((p) => effectiveSelected.has(p)),
      togglePlatform: (p) => {
        setSelected((prev) => {
          const base = prev.size === 0 ? new Set(platforms) : new Set(prev)
          if (base.has(p) && base.size === 1) return base
          if (base.has(p)) base.delete(p)
          else base.add(p)
          return base
        })
      },
      selectAll: () => setSelected(new Set(platforms)),
      section,
      setSection,
      scrollToSection,
    }),
    [platforms, effectiveSelected, section, scrollToSection],
  )

  return (
    <DashboardFilterContext.Provider value={value}>
      <div className="min-h-screen bg-bg text-ink">
        <div className="flex min-h-screen">
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Persistent sticky chrome: account header + global filters */}
            <div className="sticky top-0 z-40 border-b border-border/60 bg-bg/95 shadow-[0_1px_0_rgb(6_31_69_/_4%)] backdrop-blur-xl">
              <div className="lg:hidden">
                <Header sticky={false} compact />
                <div className="border-t border-border px-4 py-2">
                  <Button variant="secondary" size="sm" onClick={() => setMobileOpen(true)}>
                    Menu
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block">
                <Header sticky={false} compact />
              </div>
              <FilterBar />
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </div>
    </DashboardFilterContext.Provider>
  )
}
