import { cn } from '../lib/cn'

/** Spec v17.1 §22.6 — app icon: white M on brand teal. Phone header uses icon at 28px. */
export function BrandMark({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <img
      src="/brand/icon.svg"
      width={size}
      height={size}
      alt=""
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Horizontal lock-up: icon + navy wordmark. Plan badges stay outside clear space. */
export function BrandLockup({
  className,
  titleClassName,
}: {
  className?: string
  titleClassName?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark size={28} />
      <span
        className={cn(
          'font-display text-lg font-bold tracking-tight text-navy dark:text-white sm:text-xl',
          titleClassName,
        )}
      >
        MarginOS
      </span>
    </div>
  )
}
