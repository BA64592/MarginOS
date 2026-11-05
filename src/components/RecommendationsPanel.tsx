import { Lightbulb } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { hasPaidAccess } from '../lib/plans'
import { Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'

export function RecommendationsPanel() {
  const { access, result } = useApp()

  return (
    <section>
      <SectionHeading
        eyebrow="Recommendations"
        title="What to fix next"
        description={
          hasPaidAccess(access)
            ? 'A clear next step for every leak, with the figures behind it.'
            : 'Free includes one headline action naming the product to fix first.'
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
            <p className="mt-1 text-sm text-ink sm:text-[15px]">{result.headlineAction}</p>
          </div>
        </div>
      </Card>
      {hasPaidAccess(access) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.leaks.map((leak) => (
            <Card key={leak.id}>
              <p className="text-sm font-semibold text-ink">{leak.title}</p>
              <p className="mt-2 text-sm text-subtle">{leak.recommendation}</p>
            </Card>
          ))}
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
