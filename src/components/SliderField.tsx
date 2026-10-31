import { Input } from './ui'

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-ink">{label}</label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            className="min-h-11 w-24 px-2 text-right tabular-nums"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {suffix ? <span className="text-xs text-subtle">{suffix}</span> : null}
        </div>
      </div>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  )
}
