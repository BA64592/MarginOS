import { useEffect, useRef } from 'react'

/**
 * IntersectionObserver scroll-spy for continuous dashboard sections.
 * Active section = the observed block intersecting the upper viewport band.
 * Programmatic sidebar clicks lock updates until smooth-scroll settles.
 */
export function useScrollSpy(
  sectionIds: string[],
  onActive: (id: string) => void,
  opts?: { headerOffsetPx?: number },
) {
  const lockRef = useRef(false)
  const unlockTimer = useRef<number | null>(null)
  const onActiveRef = useRef(onActive)
  onActiveRef.current = onActive
  const headerOffset = opts?.headerOffsetPx ?? 120

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    const visible = new Map<string, number>()

    const pick = () => {
      if (lockRef.current) return
      let bestId: string | null = null
      let bestScore = Number.NEGATIVE_INFINITY
      for (const el of elements) {
        const rect = el.getBoundingClientRect()
        // Prefer section whose top is nearest just below the sticky chrome
        const top = rect.top - headerOffset
        const inBand = rect.bottom > headerOffset + 8 && rect.top < window.innerHeight * 0.65
        if (!inBand) continue
        const ratio = visible.get(el.id) ?? 0
        // Closer to sticky edge + higher intersection wins
        const score = ratio * 2 - Math.abs(top) / 1000
        if (score > bestScore) {
          bestScore = score
          bestId = el.id
        }
      }
      if (bestId) onActiveRef.current(bestId)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        pick()
      },
      {
        root: null,
        // Active reading band under sticky header
        rootMargin: `-${headerOffset}px 0px -45% 0px`,
        threshold: [0, 0.08, 0.16, 0.28, 0.4, 0.55, 0.7, 1],
      },
    )

    for (const el of elements) io.observe(el)
    pick()

    return () => {
      io.disconnect()
      if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    }
  }, [sectionIds.join('|'), headerOffset])

  const scrollToSection = (domId: string) => {
    const el = document.getElementById(domId)
    if (!el) return
    lockRef.current = true
    onActiveRef.current(domId)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    unlockTimer.current = window.setTimeout(() => {
      lockRef.current = false
    }, 900)
  }

  return { scrollToSection }
}
