import { jsPDF } from 'jspdf'
import { formatMoney, formatPct } from './format'
import type { AnalysisResult, HomeCurrency, Scenario } from './types'

export function exportPdfReport(args: {
  result: AnalysisResult
  scenarios: { scenario: Scenario; result: AnalysisResult }[]
  currency: HomeCurrency
  usingSampleData?: boolean
}) {
  const { result, scenarios, currency, usingSampleData } = args
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin

  const line = (
    text: string,
    opts?: { size?: number; bold?: boolean; color?: [number, number, number] },
  ) => {
    const size = opts?.size ?? 11
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...(opts?.color ?? [15, 23, 42]))
    const lines = doc.splitTextToSize(text, 515)
    doc.text(lines, margin, y)
    y += lines.length * (size + 4) + 4
    if (y > 770) {
      doc.addPage()
      y = margin
    }
  }

  line('MarginOS Report', { size: 20, bold: true, color: [15, 118, 110] })
  line('Find where your margin leaks and what each leak costs you.', {
    size: 10,
    color: [91, 107, 124],
  })
  line(`Generated ${new Date().toLocaleString('en-GB')} · ${currency}`, {
    size: 9,
    color: [91, 107, 124],
  })
  if (usingSampleData) {
    line('Sample data — not your live shop.', { size: 10, bold: true, color: [180, 83, 9] })
  }
  y += 6

  line('Overview', { size: 14, bold: true })
  line(`True profit: ${formatMoney(result.totals.trueProfit, currency)}`)
  line(`Revenue: ${formatMoney(result.totals.revenue, currency)}`)
  line(`Net margin: ${formatPct(result.totals.netMarginPct)}`)
  line(
    `Health Score: ${result.health.score ?? '—'} / 100 (${result.health.band ?? 'n/a'}, confidence ${result.health.confidence})`,
  )
  y += 4

  line('Health breakdown', { size: 14, bold: true })
  result.health.parts.forEach((p) => {
    line(
      p.dropped
        ? `${p.label}: dropped — ${p.dropReason}`
        : `${p.label}: ${p.score}/100 — ${p.detail}`,
      { size: 10 },
    )
  })
  y += 4

  line('Margin leaks (ranked by monthly impact)', { size: 14, bold: true })
  if (!result.leaks.length) line('No launch leaks triggered.')
  result.leaks.forEach((leak, i) => {
    line(`${i + 1}. ${leak.title} — ${formatMoney(leak.monthlyImpact, currency, true)}/mo`, {
      bold: true,
    })
    line(leak.description, { size: 10 })
    line(`Action: ${leak.recommendation}`, { size: 10 })
    y += 2
  })

  y += 4
  line('Scenarios', { size: 14, bold: true })
  scenarios.forEach(({ scenario, result: r }) => {
    line(
      `${scenario.name}: profit ${formatMoney(r.totals.trueProfit, currency)} · margin ${formatPct(r.totals.netMarginPct)} · score ${r.health.score ?? '—'}`,
    )
  })

  y += 8
  line('MarginOS — Pro lifetime. Sold through Link (Stripe Managed Payments).', {
    size: 9,
    color: [91, 107, 124],
  })
  doc.save(`MarginOS-Report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
