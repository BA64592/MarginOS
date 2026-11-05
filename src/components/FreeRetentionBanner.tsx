import { useApp } from '../context/AppContext'

/**
 * v17 Free 24h retention UI — retired by v18 K39 (deletion at subscription access end).
 * Still surfaces a one-shot notice if legacy clocks left a deletion message in storage.
 */
export function FreeRetentionBanner() {
  const { freeDataDeletedNotice, dismissFreeDataDeletedNotice } = useApp()
  if (!freeDataDeletedNotice) return null
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

export function FreeUploadPolicyNote() {
  return null
}
