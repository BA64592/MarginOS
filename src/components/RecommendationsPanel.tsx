import { Lightbulb } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'

export function RecommendationsPanel() {
  const { result, plan } = useApp()

  return (
    <section>
      <SectionHeading
        eyebrow="Recommendations"
        title="What to fix next"
        description={
          plan === 'pro'
            ? 'Specific actions for every leak, ordered by impact.'
            : 'Free includes one headline action. Pro unlocks an action for every leak.'
        }
      />

      <Card className="mb-3 border-accent/30 bg-accent-soft/40">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white dark:text-slate-950">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Headline action
            </p>
            <p className="mt-1 text-sm text-ink sm:text-[15px]">{result.headlineRecommendation}</p>
          </div>
        </div>
      </Card>

      {plan === 'pro' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.leaks.map((leak) => (
            <Card key={leak.id}>
              <p className="text-sm font-semibold text-ink">{leak.title}</p>
              <p className="mt-2 text-sm text-subtle">{leak.recommendation}</p>
            </Card>
          ))}
          {!result.leaks.length ? (
            <Card>
              <p className="text-sm text-subtle">No extra actions — portfolio is within benchmarks.</p>
            </Card>
          ) : null}
        </div>
      ) : (
        <ProGate label="Actions for every leak — Pro">
          <div className="grid gap-3 sm:grid-cols-2">
            {result.leaks.slice(0, 4).map((leak) => (
              <Card key={leak.id}>
                <p className="text-sm font-semibold text-ink">{leak.title}</p>
                <p className="mt-2 text-sm text-subtle">{leak.recommendation}</p>
              </Card>
            ))}
          </div>
        </ProGate>
      )}
    </section>
  )
}
