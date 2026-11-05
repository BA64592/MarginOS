import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Mount children once the sentinel is near the viewport (lazy analytical modules). */
export function LazyMount({
  children,
  rootMargin = '280px 0px',
  minHeight = 240,
  label,
}: {
  children: ReactNode
  rootMargin?: string
  minHeight?: number
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || ready) return
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true)
          io.disconnect()
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ready, rootMargin])

  return (
    <div ref={ref} style={{ minHeight: ready ? undefined : minHeight }}>
      {ready ? (
        children
      ) : (
        <div
          className="flex min-h-[12rem] items-center justify-center rounded-[12px] border border-dashed border-border bg-elevated/60 text-sm text-subtle"
          aria-hidden
        >
          {label ?? 'Loading module…'}
        </div>
      )}
    </div>
  )
}
