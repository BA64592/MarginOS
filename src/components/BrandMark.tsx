import { PRODUCT_NAME } from '../lib/brand'
import { cn } from '../lib/cn'

/** Spec v17.1 §22.6 — official mark (bars + rising arrow) on brand teal. Header uses 28px. */
export function BrandMark({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <img
      src="/brand/icon.png"
      srcSet="/brand/icon.png 1x, /brand/icon-192.png 2x"
      width={size}
      height={size}
      alt=""
      className={cn('shrink-0 rounded-[6px]', className)}
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
          'font-display text-lg font-bold tracking-tight text-navy sm:text-xl',
          titleClassName,
        )}
      >
        {PRODUCT_NAME}
      </span>
    </div>
  )
}
