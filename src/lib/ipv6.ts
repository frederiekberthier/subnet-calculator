// Rekenkern voor IPv6-verkorting. Puur (geen DOM), zodat alles met unit tests te controleren is.
// Een adres = 8 blokken (getallen 0 - 0xffff).
import type { FieldResult } from './check'

export type Groups = number[]

/** Een reeks opeenvolgende 0-blokken. */
export interface ZeroRun {
  start: number
  length: number
}

const HEX_GROUP = /^[0-9a-f]{1,4}$/

/** Lees een volledig of verkort adres in (hoofd- of kleine letters). Geeft null bij een ongeldig adres. */
export function parseIpv6(text: string): Groups | null {
  const t = text.trim().toLowerCase()
  if (!/^[0-9a-f:]+$/.test(t) || t.includes(':::') || t.split('::').length > 2) return null
  const toGroups = (part: string) => (part === '' ? [] : part.split(':'))
  if (t.includes('::')) {
    const [left, right] = t.split('::').map(toGroups)
    const written = [...left, ...right]
    // :: staat voor minstens één 0-blok, dus hoogstens 7 uitgeschreven blokken.
    if (written.length > 7 || !written.every((g) => HEX_GROUP.test(g))) return null
    const zeros = Array(8 - written.length).fill('0')
    return [...left, ...zeros, ...right].map((g) => parseInt(g, 16))
  }
  const groups = t.split(':')
  if (groups.length !== 8 || !groups.every((g) => HEX_GROUP.test(g))) return null
  return groups.map((g) => parseInt(g, 16))
}

/** Volledig uitgeschreven: 8 blokken van 4 hexadecimale cijfers (zo staat de opgave er). */
export function formatFull(groups: Groups, upper = false): string {
  const text = groups.map((g) => g.toString(16).padStart(4, '0')).join(':')
  return upper ? text.toUpperCase() : text
}

/** Regel 1: voorloopnullen per blok weglaten (0db8 → db8, 0000 → 0). */
export function stripLeadingZeros(groups: Groups): string {
  return groups.map((g) => g.toString(16)).join(':')
}

/** Alle reeksen opeenvolgende 0-blokken, van links naar rechts. */
export function zeroRuns(groups: Groups): ZeroRun[] {
  const runs: ZeroRun[] = []
  groups.forEach((g, i) => {
    if (g !== 0) return
    const last = runs.at(-1)
    if (last && last.start + last.length === i) last.length++
    else runs.push({ start: i, length: 1 })
  })
  return runs
}

/** Regel 2: één reeks 0-blokken vervangen door :: (na het weglaten van de voorloopnullen). */
export function compress(groups: Groups, run: ZeroRun): string {
  const part = (from: number, to: number) => groups.slice(from, to).map((g) => g.toString(16)).join(':')
  return `${part(0, run.start)}::${part(run.start + run.length, 8)}`
}

/** De kortste schrijfwijze: :: op de langste reeks (bij gelijke lengte de eerste). */
export function shortest(groups: Groups): string {
  const runs = zeroRuns(groups)
  if (runs.length === 0) return stripLeadingZeros(groups)
  const longest = runs.reduce((best, run) => (run.length > best.length ? run : best))
  return compress(groups, longest)
}

/** Alle juiste verkortingen: :: op elk van de reeksen nullen. */
export function validShortenings(groups: Groups): string[] {
  const runs = zeroRuns(groups)
  return runs.length === 0 ? [stripLeadingZeros(groups)] : runs.map((run) => compress(groups, run))
}

/**
 * Controleer een verkort adres. Juist als het hetzelfde adres is, alle voorloopnullen weg zijn,
 * :: precies één keer gebruikt is (als er nullen zijn) en :: een volledige reeks 0-blokken vervangt.
 * Welke reeks maakt niet uit, en één enkel 0-blok mag ook. Hoofdletters zijn toegelaten.
 */
export function checkShortened(answer: string, groups: Groups): FieldResult {
  const t = answer.trim().toLowerCase()
  if (t === '') return { status: 'empty' }
  if (t.split('::').length > 2) return { status: 'format', hint: 'ipv6Once' }
  const parsed = parseIpv6(t)
  if (parsed === null) return { status: 'format', hint: 'ipv6Format' }
  if (parsed.some((g, i) => g !== groups[i])) return { status: 'wrong' }

  const written = t.split(/::|:/).filter((g) => g !== '')
  if (written.some((g) => g.length > 1 && g.startsWith('0'))) return { status: 'format', hint: 'ipv6LeadingZeros' }

  const hasZeros = groups.includes(0)
  if (!t.includes('::')) return hasZeros ? { status: 'format', hint: 'ipv6UseDoubleColon' } : { status: 'ok' }

  // Welke blokken vervangt de ::? Die moeten samen een volledige reeks nullen zijn.
  const [left, right] = t.split('::').map((p) => (p === '' ? 0 : p.split(':').length))
  const start = left
  const end = 8 - right // exclusief
  const full = groups[start - 1] !== 0 && (end >= 8 || groups[end] !== 0)
  return full ? { status: 'ok' } : { status: 'format', hint: 'ipv6PartialRun' }
}
