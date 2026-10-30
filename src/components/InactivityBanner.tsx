import { useApp } from '../context/AppContext'

/** 24-month inactivity notices (v16.4 K8 / F9). */
export function InactivityBanner() {
  const { inactivityNotice, dismissInactivityNotice } = useApp()
  if (!inactivityNotice) return null
  return (
    <div className="border-b border-warn/30 bg-warn-soft px-4 py-2 text-center text-xs text-warn sm:px-6">
      {inactivityNotice}{' '}
      <button type="button" className="font-semibold underline" onClick={dismissInactivityNotice}>
        Dismiss
      </button>
    </div>
  )
}
