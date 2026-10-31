import { useState, type ReactNode } from 'react'
import { en } from '../i18n/en'

export function MathsDisclosure({
  lines,
  children,
}: {
  lines: string[]
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  if (!lines.length && !children) return null
  return (
    <div className="mt-2">
      <button
        type="button"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline-offset-2 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? en.hideTheMaths : en.showTheMaths}
      </button>
      {open ? (
        <div className="mt-2 space-y-1 rounded-lg bg-muted/80 px-3 py-2 text-xs text-subtle">
          {lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          {children}
        </div>
      ) : null}
    </div>
  )
}
