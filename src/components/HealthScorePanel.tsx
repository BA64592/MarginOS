import { useApp } from '../context/AppContext'
import { healthTone } from '../lib/calc'
import { cn } from '../lib/cn'
import { Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'

const RADIUS = 54
const CIRC = 2 * Math.PI * RADIUS

export function HealthScorePanel() {
  const { result, plan } = useApp()
  const tone = healthTone(result.healthScore)
  const offset = CIRC - (result.healthScore / 100) * CIRC
  const parts = Object.values(result.healthBreakdown)

  return (
    <section>
      <SectionHeading
        eyebrow="Diagnosis"
        title="Margin Health Score"
        description="A 0–100 score that explains which cost areas are dragging true profit."
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="flex flex-col items-center justify-center">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke="var(--bg-muted)"
                strokeWidth="12"
              />
              <circle
                cx="70"
                cy="70"
                r={RADIUS}
                fill="none"
                stroke={
                  tone === 'ok'
                    ? 'var(--ok)'
                    : tone === 'warn'
                      ? 'var(--warn)'
                      : 'var(--danger)'
                }
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                className="animate-score-fill transition-[stroke-dashoffset] duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
              <span
                className={cn(
                  'font-display text-4xl font-semibold',
                  tone === 'ok' && 'text-ok',
                  tone === 'warn' && 'text-warn',
                  tone === 'danger' && 'text-danger',
                )}
              >
                {result.healthScore}
              </span>
              <span className="text-xs text-subtle">Overall</span>
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-subtle">
            {tone === 'ok'
              ? 'Healthy margins vs benchmarks'
              : tone === 'warn'
                ? 'Fixable leaks — prioritise the top £ impact'
                : 'Margin under pressure — act on high-severity leaks'}
          </p>
        </Card>

        {plan === 'free' ? (
          <ProGate label="Score breakdown — Pro">
            <BreakdownGrid parts={parts} productRows={result.products} />
          </ProGate>
        ) : (
          <BreakdownGrid parts={parts} productRows={result.products} />
        )}
      </div>
    </section>
  )
}

function BreakdownGrid({
  parts,
  productRows,
}: {
  parts: { label: string; score: number; max: number; valuePct: number }[]
  productRows: { product: { id: string; name: string }; marginPct: number; trueProfit: number }[]
}) {
  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-ink">By cost area</p>
      <div className="space-y-3">
        {parts.map((part) => (
          <div key={part.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink">{part.label}</span>
              <span className="text-subtle">
                {part.score}/{part.max} · {part.valuePct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(part.score / part.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold text-ink">By product</p>
      <div className="space-y-2">
        {productRows.map((row) => (
          <div
            key={row.product.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/70 px-3 py-2 text-sm"
          >
            <span className="truncate font-medium text-ink">{row.product.name}</span>
            <span
              className={cn(
                'shrink-0 tabular-nums',
                row.marginPct >= 20 ? 'text-ok' : row.marginPct >= 8 ? 'text-warn' : 'text-danger',
              )}
            >
              {row.marginPct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
