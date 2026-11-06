/** Shared CSV parsing rules from amendment v16.1 A1. */

export function normalizeHeader(h: string) {
  return h.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseCsv(text: string): string[][] {
  const raw = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    const next = raw[i + 1]
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && (ch === '\n' || (ch === '\r' && next === '\n'))) {
      row.push(cur.trim())
      cur = ''
      if (row.some((c) => c.length)) rows.push(row)
      row = []
      if (ch === '\r') i++
      continue
    }
    if (!inQuotes && ch === '\r') {
      row.push(cur.trim())
      cur = ''
      if (row.some((c) => c.length)) rows.push(row)
      row = []
      continue
    }
    if (!inQuotes && ch === ',') {
      row.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  row.push(cur.trim())
  if (row.some((c) => c.length)) rows.push(row)
  return rows
}

/** Strip currency symbols / separators; support EU comma decimals; "--" = empty. */
export function parseAmount(value: string | undefined | null): number | null {
  if (value == null) return null
  const v = value.trim()
  if (!v || v === '--' || v === '—') return null
  let s = v.replace(/[£$€CA\s]/gi, '').replace(/AUD/gi, '')
  // thousands separators
  if (s.includes(',') && s.includes('.')) {
    // US: 1,234.56 or EU: 1.234,56
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',') && /^\d+,\d{1,2}$/.test(s)) {
    s = s.replace(',', '.')
  } else {
    s = s.replace(/,/g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function parseDateLoose(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  const v = value.trim()
  // ISO-ish / RFC / "Oct 1, 2024 12:00:00 AM PDT"
  const iso = Date.parse(v)
  if (!Number.isNaN(iso)) {
    return new Date(iso).toISOString().slice(0, 10)
  }
  // DD.MM.YYYY or DD/MM/YYYY (EU Amazon)
  const eu = v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/)
  if (eu) {
    const d = Number(eu[1])
    const m = Number(eu[2])
    const y = Number(eu[3])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }
  // YYYY-MM-DD already handled by Date.parse; bare YYYY/MM/DD
  const ymd = v.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (ymd) {
    const y = Number(ymd[1])
    const m = Number(ymd[2])
    const d = Number(ymd[3])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }
  return null
}

export function headerIndex(headers: string[]): Record<string, number> {
  const idx: Record<string, number> = {}
  headers.forEach((h, i) => {
    idx[normalizeHeader(h)] = i
  })
  return idx
}

export function cell(row: string[], idx: Record<string, number>, ...names: string[]) {
  for (const name of names) {
    const i = idx[normalizeHeader(name)]
    if (i != null && row[i] != null && String(row[i]).length) return row[i]
  }
  return ''
}

export function requireColumns(idx: Record<string, number>, required: string[]): string | null {
  const missing = required.filter((r) => idx[normalizeHeader(r)] == null)
  if (!missing.length) return null
  return `Missing required column(s): ${missing.join(', ')}`
}

/** Personal data columns to strip (never stored) — section 6 / A1. */
export const STRIP_HEADER_HINTS = [
  'email',
  'phone',
  'billing name',
  'shipping name',
  'buyer',
  'full name',
  'first name',
  'last name',
  'street',
  'address1',
  'address2',
  'address 1',
  'address 2',
  'city',
  'zip',
  'zipcode',
  'postcode',
  'company',
  'notes',
  'note attributes',
  'gift',
  'ship name',
  'ship address',
  'ship city',
  'ship zipcode',
  'order city',
  'order postal',
]

export function isPersonalDataHeader(h: string): boolean {
  const n = h.toLowerCase()
  return STRIP_HEADER_HINTS.some((s) => n.includes(s))
}

/** User-visible warning when personal columns appear in an export (not stored). */
export function personalDataStripWarning(headers: string[]): string | null {
  const stripped = headers.filter((h) => h.trim() && isPersonalDataHeader(h))
  if (!stripped.length) return null
  const shown = stripped.slice(0, 8).join(', ')
  const more = stripped.length > 8 ? ` (+${stripped.length - 8} more)` : ''
  return `Personal data columns were removed and not stored: ${shown}${more}.`
}
