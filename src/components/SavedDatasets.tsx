import { useApp } from '../context/AppContext'
import { Button, Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'

function Inner() {
  const { savedDatasets, saveDataset } = useApp()
  return (
    <Card>
      <Button size="sm" onClick={() => saveDataset(`Dataset ${savedDatasets.length + 1}`)}>
        Save current view
      </Button>
      {!savedDatasets.length ? (
        <p className="mt-3 text-sm text-subtle">
          Saved datasets are named views (date range + platforms) over your Pro shop — not separate row copies.
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

export function SavedDatasets() {
  const { plan } = useApp()
  return (
    <section>
      <SectionHeading
        eyebrow="Datasets"
        title="Saved datasets"
        description="Reopen a saved view of your shop. Score history over time is a later update."
      />
      {plan === 'pro' ? <Inner /> : <ProGate label="Saved datasets — Pro"><Inner /></ProGate>}
    </section>
  )
}
