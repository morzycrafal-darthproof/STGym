export function uid(): string {
  // randomUUID is missing on non-secure origins (e.g. opening the dev server from a phone over LAN).
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): string {
  return isoDate(new Date())
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function shortDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

/** Monday of the week containing the given date. */
export function weekStart(iso: string): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return isoDate(d)
}

export function clone<T>(v: T): T {
  return structuredClone(v)
}

/** First number in a string, accepting decimal commas: "77,5" → 77.5, "90–100" → 90. */
export function num(s: string | undefined | null): number | null {
  if (!s) return null
  const m = s.replace(',', '.').match(/\d+(?:\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

export function fmt(n: number, digits = 1): string {
  return n.toLocaleString('pl-PL', { maximumFractionDigits: digits })
}

/** Adds delta to every number in a weight string: "90–100" + 2.5 → "92,5–102,5". */
export function addToWeight(s: string, delta: number): string {
  return s.replace(/\d+(?:[.,]\d+)?/g, (m) => fmt(parseFloat(m.replace(',', '.')) + delta, 2))
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
