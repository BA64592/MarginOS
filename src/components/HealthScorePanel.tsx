import { useApp } from '../context/AppContext'
import { cn } from '../lib/cn'
import { Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'
import { MathsDisclosure } from './MathsDisclosure'

const RADIUS = 54
const CIRC = 2 * Math.PI * RADIUS

export function HealthScorePanel() {
  const { result, plan } = useApp()
  const score = result.health.score ?? 0
  const tone =
    result.health.band === 'Strong'
      ? 'ok'
      : result.health.band === 'Needs attention'
        ? 'warn'
        : 'danger'
  const offset = CIRC - (score / 100) * CIRC

  return (
    <section>
      <SectionHeading
        eyebrow="Diagnosis"
        title="Margin Health Score"
        description="Weighted parts from §12.1 — missing parts are dropped and weights rescaled."
      />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="flex flex-col items-center justify-center">
          {result.health.score == null ? (
            <p className="text-center text-sm text-subtle">No score — check the file (revenue is 0).</p>
          ) : (
            <>
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--bg-muted)" strokeWidth="12" />
                  <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={
                      tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--danger)'
                    }
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                    className="animate-score-fill"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      'font-display text-4xl font-semibold',
                      tone === 'ok' && 'text-ok',
                      tone === 'warn' && 'text-warn',
                      tone === 'danger' && 'text-danger',
                    )}
                  >
                    {result.health.score}
                  </span>
                  <span className="text-xs text-subtle">{result.health.band}</span>
                </div>
              </div>
              <p className="mt-2 text-center text-sm text-subtle">
                Confidence: {result.health.confidence}
              </p>
            </>
          )}
          <MathsDisclosure lines={result.health.maths.concat(result.health.confidenceReasons)} />
        </Card>

        {plan === 'free' ? (
          <ProGate label="Score breakdown by part — Pro">
            <Breakdown parts={result.health.parts} />
          </ProGate>
        ) : (
          <Breakdown parts={result.health.parts} />
        )}
      </div>
    </section>
  )
}

function Breakdown({
  parts,
}: {
  parts: { label: string; score: number | null; dropped: boolean; dropReason?: string; detail: string; weight: number }[]
}) {
  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-ink">By score part</p>
      <div className="space-y-3">
        {parts.map((part) => (
          <div key={part.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">
                {part.label}{' '}
                <span className="text-xs text-subtle">({part.weight}%)</span>
              </span>
              <span className="text-subtle">
                {part.dropped ? 'Dropped' : `${part.score}/100`}
              </span>
            </div>
            {part.dropped ? (
              <p className="text-xs text-subtle">{part.dropReason}</p>
            ) : (
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${part.score ?? 0}%` }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-subtle">{part.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
