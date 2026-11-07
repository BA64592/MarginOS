/** High-fidelity product UI mockups for the marketing home — decorative, aria-hidden. */
import { en } from '../../i18n/en'

function Shell({
  active,
  children,
  title,
}: {
  active: string
  children: React.ReactNode
  title: string
}) {
  const nav = ['Overview', 'Upload', 'Leaks', 'Charts', 'Calculators', 'Scenarios']
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-elevated shadow-[0_20px_50px_rgb(6_31_69_/_10%)]">
      <div className="flex items-center justify-between border-b border-border bg-bg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-xs font-semibold text-navy">{title}</span>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="rounded-[8px] border border-border bg-elevated px-2 py-0.5 text-[10px] text-subtle">
            2026-09-05 → 2026-09-20
          </span>
          <span className="rounded-[8px] bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
            All platforms
          </span>
        </div>
      </div>
      <div className="flex min-h-[280px]">
        <aside className="hidden w-36 shrink-0 border-r border-border bg-bg/80 p-2 sm:block">
          {nav.map((item) => (
            <div
              key={item}
              className={`rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium ${
                item === active ? 'bg-accent-soft text-accent' : 'text-subtle'
              }`}
            >
              {item}
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1 p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}

export function OverviewDashboardMock() {
  return (
    <div className="mkt-showcase-panel" aria-hidden>
      <Shell active="Overview" title="Profit diagnosis">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'True profit', value: '£2,691', tone: 'text-navy' },
            { label: 'Net margin', value: '14.2%', tone: 'text-navy' },
            { label: 'Health score', value: '69', tone: 'text-warn', hint: '/ 100' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-[12px] border border-border bg-bg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                {kpi.label}
              </p>
              <p className={`mt-1 font-display text-2xl font-semibold ${kpi.tone}`}>
                {kpi.value}
                {kpi.hint ? <span className="text-sm font-medium text-subtle">{kpi.hint}</span> : null}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-[12px] border border-border bg-bg p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            Headline action
          </p>
          <p className="mt-1 text-sm font-semibold text-navy">
            Trail Runner Pack: raise price to £73.51, or discontinue.
          </p>
          <p className="mt-1 text-xs text-subtle">Highest-£ fix first — {en.showTheMaths} on every figure.</p>
        </div>
      </Shell>
    </div>
  )
}

export function LeaksDashboardMock() {
  const leaks = [
    { name: 'Loss-making product', impact: '−£840', band: 'At risk' },
    { name: 'Unprofitable ads', impact: '−£520', band: 'Needs attention' },
    { name: 'Fee drag', impact: '−£310', band: 'Needs attention' },
    { name: 'Shipping subsidy', impact: '−£180', band: 'Watch' },
    { name: 'High returns', impact: '−£95', band: 'Watch' },
    { name: 'Thin pricing', impact: '−£60', band: 'Watch' },
  ]
  return (
    <div className="mkt-showcase-panel" aria-hidden>
      <Shell active="Leaks" title="Six leaks · ranked">
        <ul className="space-y-2">
          {leaks.map((leak, i) => (
            <li
              key={leak.name}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-bg px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">
                  <span className="mr-2 text-accent">#{i + 1}</span>
                  {leak.name}
                </p>
                <p className="text-[11px] text-subtle">{leak.band}</p>
              </div>
              <p className="shrink-0 font-display text-base font-semibold tabular-nums text-danger">
                {leak.impact}
                <span className="text-[10px] font-medium text-subtle"> / mo</span>
              </p>
            </li>
          ))}
        </ul>
      </Shell>
    </div>
  )
}

export function ChartsDashboardMock() {
  const bars = [
    { name: 'Ceramic', h: 42, loss: false },
    { name: 'Scarf', h: 68, loss: false },
    { name: 'Trail', h: 88, loss: true },
    { name: 'Tee', h: 18, loss: false },
    { name: 'Print', h: 55, loss: false },
    { name: 'Mug', h: 36, loss: false },
  ]
  return (
    <div className="mkt-showcase-panel" aria-hidden>
      <Shell active="Charts" title="Where the money goes">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[12px] border border-border bg-bg p-3">
            <p className="text-xs font-semibold text-navy">Allocation</p>
            <p className="text-[10px] text-subtle">Share of period costs</p>
            <div className="mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-[#061F45] border-b-[#34726B] border-l-[#7FC4BA] border-r-[#AEBBD0]" />
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-subtle">
              <span>Product</span>
              <span>Shipping</span>
              <span>Fees</span>
              <span>Ads</span>
            </div>
          </div>
          <div className="rounded-[12px] border border-border bg-bg p-3">
            <p className="text-xs font-semibold text-navy">True profit by product</p>
            <p className="text-[10px] text-subtle">Losses in red</p>
            <div className="mt-4 flex h-40 items-end gap-2">
              {bars.map((b) => (
                <div key={b.name} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-[6px]"
                    style={{
                      height: `${b.h}%`,
                      background: b.loss ? '#C21F3E' : '#34726B',
                    }}
                  />
                  <span className="truncate text-[9px] text-subtle">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    </div>
  )
}

export function ToolsDashboardMock() {
  return (
    <div className="mkt-showcase-panel" aria-hidden>
      <Shell active="Calculators" title="Tools & scenarios">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] border border-border bg-bg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Break-even ROAS
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-navy">2.4×</p>
            <p className="mt-1 text-xs text-subtle">Also ACOS &amp; break-even price</p>
          </div>
          <div className="rounded-[12px] border border-border bg-bg p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
              Target price
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-navy">£73.51</p>
            <p className="mt-1 text-xs text-subtle">Blended across platforms</p>
          </div>
          <div className="rounded-[12px] border border-accent/35 bg-accent-soft/50 p-3 sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
              Scenario · +8% price
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span className="text-navy">
                True profit <strong>+£410</strong>
              </span>
              <span className="text-navy">
                Net margin <strong>17.1%</strong>
              </span>
              <span className="text-subtle">Save &amp; compare · PDF beside results</span>
            </div>
          </div>
        </div>
      </Shell>
    </div>
  )
}
