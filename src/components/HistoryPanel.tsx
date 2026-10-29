import { BookmarkPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatGbp, formatPct } from '../lib/format'
import { Button, Card, SectionHeading } from './ui'
import { ProGate } from './ProGate'

function HistoryInner() {
  const { history, saveHistorySnapshot, clearHistory } = useApp()

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => saveHistorySnapshot()}>
          <BookmarkPlus className="h-4 w-4" />
          Save this month
        </Button>
        {history.length ? (
          <Button size="sm" variant="ghost" onClick={clearHistory}>
            Clear history
          </Button>
        ) : null}
      </div>
      {!history.length ? (
        <p className="text-sm text-subtle">
          Save snapshots to compare month to month — profit, margin and Health Score.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="pb-2 font-semibold">Label</th>
                <th className="pb-2 font-semibold">Profit</th>
                <th className="pb-2 font-semibold">Margin</th>
                <th className="pb-2 font-semibold">Score</th>
                <th className="pb-2 font-semibold">SKUs</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-border">
                  <td className="py-2.5 font-medium text-ink">
                    {h.label}
                    <span className="mt-0.5 block text-xs font-normal text-subtle">
                      {new Date(h.createdAt).toLocaleString('en-GB')}
                    </span>
                  </td>
                  <td className="py-2.5 tabular-nums">{formatGbp(h.trueProfit)}</td>
                  <td className="py-2.5 tabular-nums">{formatPct(h.marginPct)}</td>
                  <td className="py-2.5 tabular-nums">{h.healthScore}</td>
                  <td className="py-2.5 tabular-nums">{h.productCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function HistoryPanel() {
  const { plan } = useApp()

  return (
    <section>
      <SectionHeading
        eyebrow="History"
        title="Saved months"
        description="Compare month to month after you save a snapshot."
      />
      {plan === 'pro' ? (
        <HistoryInner />
      ) : (
        <ProGate label="Saved history — Pro">
          <HistoryInner />
        </ProGate>
      )}
    </section>
  )
}
