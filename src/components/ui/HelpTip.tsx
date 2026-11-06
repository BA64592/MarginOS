import { useId, useState } from 'react'
import { cn } from '../../lib/cn'

/** Tap-to-open help (K45/K47) — never hover-only. */
export function HelpTip({
  label,
  children,
  className,
}: {
  label: string
  children: string
  className?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <span className={cn('relative inline-flex items-center gap-1', className)}>
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-[10px] text-sm font-semibold text-accent hover:bg-accent-soft"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold leading-none">
          i
        </span>
        <span className="sr-only">About {label}</span>
      </button>
      {open ? (
        <span
          id={id}
          role="note"
          className="absolute left-0 top-full z-20 mt-1 w-[min(20rem,80vw)] rounded-[10px] border border-border bg-elevated p-3 text-xs leading-relaxed text-subtle shadow-sm"
        >
          {children}
          <button
            type="button"
            className="mt-2 block text-xs font-semibold text-accent"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </span>
      ) : null}
    </span>
  )
}
