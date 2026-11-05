import { Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { hasPaidAccess } from '../lib/plans'
import { Badge, Button, Card, SectionHeading } from './ui'

function Inner() {
  const { savedDatasets, saveDataset } = useApp()
  return (
    <Card>
      <Button size="sm" onClick={() => saveDataset(`Dataset ${savedDatasets.length + 1}`)}>
        Save current view
      </Button>
      {!savedDatasets.length ? (
        <p className="mt-3 text-sm text-subtle">
          Saved datasets are named views (date range + platforms) over your Pro shop — not separate
          row copies.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {savedDatasets.map((d) => (
            <li key={d.id} className="rounded-lg bg-muted/80 px-3 py-2 text-sm">
              <span className="font-semibold text-ink">{d.name}</span>
              <span className="mt-0.5 block text-xs text-subtle">
                {d.start} → {d.end} · {d.platforms.join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function FreeLockedPlaceholder() {
  return (
    <Card className="border-dashed">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-muted">
          <Lock className="h-4 w-4 text-ink" aria-hidden />
        </div>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">Saved datasets</p>
            <Badge tone="pro">Pro</Badge>
          </div>
          <p className="text-sm text-subtle">
            Save named views of your shop (date range and platforms) when you upgrade to Pro.
          </p>
        </div>
      </div>
    </Card>
  )
}

export function SavedDatasets() {
  const { access } = useApp()
  return (
    <section>
      <SectionHeading
        eyebrow="Datasets"
        title="Saved datasets"
        description="Reopen a saved view of your shop."
      />
      {hasPaidAccess(access) ? <Inner /> : <FreeLockedPlaceholder />}
    </section>
  )
}
