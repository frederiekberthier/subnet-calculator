// Antwoorden van studenten normaliseren en vergelijken met de verwachte waarde.
import { parseIp } from './ipv4'

export type FieldResult =
  | { status: 'ok' }
  | { status: 'empty' }
  | { status: 'format'; hint: string }
  | { status: 'wrong' }

const OK: FieldResult = { status: 'ok' }
const EMPTY: FieldResult = { status: 'empty' }
const WRONG: FieldResult = { status: 'wrong' }

export function checkDecimalOctet(input: string, expected: number): FieldResult {
  const t = input.trim()
  if (t === '') return EMPTY
  if (!/^\d{1,3}$/.test(t) || Number(t) > 255) return { status: 'format', hint: 'Een byte is een getal van 0 tot 255.' }
  return Number(t) === expected ? OK : WRONG
}

export function checkBinaryOctet(input: string, expected: number): FieldResult {
  const t = input.replace(/\s/g, '')
  if (t === '') return EMPTY
  if (!/^[01]+$/.test(t)) return { status: 'format', hint: 'Gebruik enkel 0 en 1.' }
  if (t.length !== 8) return { status: 'format', hint: 'Schrijf elke byte met precies 8 bits (vul aan met nullen vooraan).' }
  return parseInt(t, 2) === expected ? OK : WRONG
}

export function checkPrefix(input: string, expected: number): FieldResult {
  const t = input.trim().replace(/^\/\s*/, '')
  if (t === '') return EMPTY
  if (!/^\d{1,2}$/.test(t) || Number(t) > 32) return { status: 'format', hint: 'Een prefix is een getal van 0 tot 32, bv. /24.' }
  return Number(t) === expected ? OK : WRONG
}

export function checkIp(input: string, expected: number): FieldResult {
  const t = input.trim()
  if (t === '') return EMPTY
  const ip = parseIp(t)
  if (ip === null) return { status: 'format', hint: 'Schrijf een IPv4-adres als vier getallen (0-255) gescheiden door punten.' }
  return ip === expected ? OK : WRONG
}

export function checkInteger(input: string, expected: number): FieldResult {
  const t = input.trim().replace(/[.\s]/g, '')
  if (t === '') return EMPTY
  if (!/^\d+$/.test(t)) return { status: 'format', hint: 'Geef een geheel getal.' }
  return Number(t) === expected ? OK : WRONG
}

/** Keuze uit een vaste lijst (bv. klasse of publiek/privaat); null = niets gekozen. */
export function checkChoice(input: string | null, expected: string): FieldResult {
  if (input === null || input === '') return EMPTY
  return input === expected ? OK : WRONG
}

/**
 * Geplakte tekst opsplitsen in bytes voor de 4 vakjes van een adres.
 * Decimaal: "192.168.1.10", "192 168 1 10" of "192,168,1,10". Binair: met punten/spaties of 32 bits aan één stuk.
 * Geeft enkel iets terug als de tekst echt uit meerdere bytes bestaat; anders een lege lijst.
 */
export function splitAddressInput(text: string, binary: boolean): string[] {
  const t = text.trim()
  if (binary) {
    const compact = t.replace(/\s/g, '')
    if (/^[01]{9,32}$/.test(compact)) return compact.match(/[01]{1,8}/g)!.slice(0, 4)
    const parts = t.split(/[.,\s]+/).filter(Boolean)
    return parts.length > 1 && parts.every((p) => /^[01]{1,8}$/.test(p)) ? parts.slice(0, 4) : []
  }
  const parts = t.split(/[.,\s]+/).filter(Boolean)
  return parts.length > 1 && parts.every((p) => /^\d{1,3}$/.test(p)) ? parts.slice(0, 4) : []
}
