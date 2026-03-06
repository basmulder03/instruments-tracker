/**
 * Minimal CSV export utility.
 *
 * Usage:
 *   downloadCsv('instruments.csv', [
 *     ['ID', 'Name', 'Type'],
 *     ['INS-0001', 'Trumpet', 'Brass'],
 *   ])
 */
export function downloadCsv(filename: string, rows: (string | number | boolean | null | undefined)[][]): void {
  const escape = (v: string | number | boolean | null | undefined): string => {
    const s = v == null ? '' : String(v)
    // Wrap in quotes if value contains comma, quote, or newline
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
