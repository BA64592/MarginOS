import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  formatDeletionTime,
  formatDurationLeft,
  msLeft,
} from '../lib/retention'
import { Button } from './ui'

/** Free 24-hour retention notices (v16.4 F2). Hidden for Pro and sample data. */
export function FreeRetentionBanner() {
  const {
    plan,
    usingSampleData,
    earliestFreeClock,
    freeClocks,
    freeDataDeletedNotice,
    dismissFreeDataDeletedNotice,
    setUpgradeOpen,
    user,
    exportDataCsv,
  } = useApp()
  const [now, setNow] = useState(() => Date.now())
  const [showBreakdown, setShowBreakdown] = useState(false)
  const tz = user?.timeZone ?? 'Europe/London'

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  if (freeDataDeletedNotice) {
    return (
      <div className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
        <p className="font-medium">{freeDataDeletedNotice}</p>
        <button
          type="button"
          className="mt-1 font-semibold underline-offset-2 hover:underline"
          onClick={dismissFreeDataDeletedNotice}
        >
          Dismiss
        </button>
      </div>
    )
  }

  if (plan !== 'free' || usingSampleData || !earliestFreeClock) return null

  const left = msLeft(earliestFreeClock, now)
  const lastHour = left > 0 && left < 60 * 60 * 1000
  const deletedAt = formatDeletionTime(earliestFreeClock.expiresAt, tz)

  const download = () => {
    const blob = new Blob([exportDataCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'marginos-data-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        lastHour
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-warn/30 bg-warn-soft text-warn'
      }`}
    >
      <p className="font-medium">
        {lastHour
          ? `Less than 1 hour left — Free data is deleted at ${deletedAt} (${tz}).`
          : `Deleted in ${formatDurationLeft(left)} · ${deletedAt} (${tz})`}
      </p>
      <p className="mt-1 opacity-90">
        Free uploads are deleted after 24 hours. Upgrade to Pro to keep your data.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {lastHour ? (
          <>
            <Button size="sm" variant="secondary" onClick={download}>
              Download my data
            </Button>
            <Button size="sm" onClick={() => setUpgradeOpen(true)}>
              Upgrade to Pro
            </Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setUpgradeOpen(true)}>
            Keep with Pro
          </Button>
        )}
        {freeClocks.length > 1 ? (
          <button
            type="button"
            className="text-xs font-semibold underline-offset-2 hover:underline"
            onClick={() => setShowBreakdown((v) => !v)}
          >
            {showBreakdown ? 'Hide clocks' : 'Show each upload'}
          </button>
        ) : null}
      </div>
      {showBreakdown ? (
        <ul className="mt-2 space-y-1 text-xs">
          {freeClocks.map((c) => (
            <li key={c.id}>
              {c.kind}: deleted {formatDeletionTime(c.expiresAt, tz)} (
              {formatDurationLeft(msLeft(c, now))} left)
              {c.pausedAt ? ' · paused (payment pending)' : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function FreeUploadPolicyNote() {
  const { plan } = useApp()
  if (plan !== 'free') {
    return (
      <p className="text-xs text-subtle">
        Original files are deleted as soon as they&apos;re imported. Only cleaned rows are kept.
      </p>
    )
  }
  return (
    <p className="text-xs text-subtle">
      Free uploads are deleted after 24 hours. Upgrade to Pro to keep your data. Original files are
      deleted as soon as they&apos;re imported.
    </p>
  )
}
