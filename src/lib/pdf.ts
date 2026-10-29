import { jsPDF } from 'jspdf'
import { formatGbp, formatPct } from './format'
import type { HistorySnapshot, PortfolioResult, Scenario } from './types'
import { analyzePortfolio, applyAdjustments } from './calc'

export async function exportPdfReport({
  result,
  scenarios,
  history,
}: {
  result: PortfolioResult
  scenarios: Scenario[]
  history: HistorySnapshot[]
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin

  const line = (text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number] }) => {
    const size = opts?.size ?? 11
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    if (opts?.color) doc.setTextColor(...opts.color)
    else doc.setTextColor(15, 23, 42)
    const lines = doc.splitTextToSize(text, 515)
    doc.text(lines, margin, y)
    y += lines.length * (size + 4) + 4
    if (y > 770) {
      doc.addPage()
      y = margin
    }
  }

  line('MarginOS Report', { size: 20, bold: true, color: [15, 118, 110] })
  line('True profit after product cost, shipping, ads, platform fees and returns.', {
    size: 10,
    color: [91, 107, 124],
  })
  line(`Generated ${new Date().toLocaleString('en-GB')}`, { size: 9, color: [91, 107, 124] })
  y += 8

  line('Overview', { size: 14, bold: true })
  line(`True profit: ${formatGbp(result.totals.trueProfit, true)}`)
  line(`Gross revenue: ${formatGbp(result.totals.grossRevenue, true)}`)
  line(`Net margin: ${formatPct(result.totals.marginPct)}`)
  line(`Margin Health Score: ${result.healthScore}/100`)
  y += 6

  line('Health breakdown', { size: 14, bold: true })
  Object.values(result.healthBreakdown).forEach((part) => {
    line(`${part.label}: ${part.score}/${part.max} (current ${part.valuePct.toFixed(1)}%)`)
  })
  y += 6

  line('Margin leaks (ranked by £ impact)', { size: 14, bold: true })
  if (!result.leaks.length) {
    line('No material leaks vs benchmarks.')
  } else {
    result.leaks.forEach((leak, i) => {
      line(`${i + 1}. ${leak.title} — ${formatGbp(leak.monthlyImpactGbp)}/mo`, { bold: true })
      line(leak.description, { size: 10 })
      line(`Action: ${leak.recommendation}`, { size: 10 })
      y += 4
    })
  }

  y += 4
  line('Scenario comparison', { size: 14, bold: true })
  scenarios.forEach((scenario) => {
    const r = analyzePortfolio(applyAdjustments(scenario.products, scenario.adjustments))
    line(
      `${scenario.name}: profit ${formatGbp(r.totals.trueProfit)} · margin ${formatPct(r.totals.marginPct)} · score ${r.healthScore}`,
    )
  })

  if (history.length) {
    y += 6
    line('Saved history', { size: 14, bold: true })
    history.slice(0, 8).forEach((h) => {
      line(
        `${h.label}: ${formatGbp(h.trueProfit)} · ${formatPct(h.marginPct)} · score ${h.healthScore}`,
        { size: 10 },
      )
    })
  }

  y += 10
  line('MarginOS — one price, no subscription. Pro £19 lifetime.', {
    size: 9,
    color: [91, 107, 124],
  })

  doc.save(`MarginOS-Report-${new Date().toISOString().slice(0, 10)}.pdf`)
}
