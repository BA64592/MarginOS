/** Full-bleed product visual for Home — stylised diagnosis report, not a floating card. */
export function DiagnosisPreview({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative h-full min-h-[420px] w-full overflow-hidden ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(145deg, #0a2a3a 0%, #34726b 42%, #1a4d47 72%, #061f45 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgb(231 247 246 / 35%), transparent 45%), radial-gradient(circle at 80% 70%, rgb(255 255 255 / 12%), transparent 40%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10 lg:justify-end lg:pr-16">
        <div className="mkt-preview-panel w-full max-w-md translate-y-2 rounded-[14px] border border-white/15 bg-white/95 p-5 text-left shadow-[0_24px_60px_rgb(6_31_69_/_35%)] backdrop-blur-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#34726b]">
            Sample diagnosis
          </p>
          <p className="mt-2 font-[family-name:var(--font-marketing)] text-2xl font-semibold tracking-tight text-[#061f45]">
            Thin margins on your bestsellers
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#475569]">True profit</p>
              <p className="font-display text-lg font-bold text-[#061f45]">£2,691</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#475569]">Health</p>
              <p className="font-display text-lg font-bold text-[#061f45]">36</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#475569]">Top leak</p>
              <p className="font-display text-lg font-bold text-[#c21f3e]">−£840</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {[
              { rank: '1', title: 'Loss-making product', impact: '−£840 / mo' },
              { rank: '2', title: 'Unprofitable ads', impact: '−£520 / mo' },
              { rank: '3', title: 'Fee drag', impact: '−£310 / mo' },
            ].map((row) => (
              <li
                key={row.rank}
                className="flex items-center justify-between gap-3 border-t border-[#d5dee9] pt-2.5 text-sm"
              >
                <span className="text-[#061f45]">
                  <span className="mr-2 font-semibold text-[#34726b]">#{row.rank}</span>
                  {row.title}
                </span>
                <span className="font-semibold tabular-nums text-[#c21f3e]">{row.impact}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#475569]">
            Ranked fixes first — every leak with monthly impact in your currency.
          </p>
        </div>
      </div>
    </div>
  )
}
