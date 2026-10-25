// Opgavegenerators voor de drie oefeningen. Puur: alle willekeur komt uit de meegegeven Rng.
import {
  MAX_USABLE_PREFIX,
    defaultPrefix,
  minPrefix,
  fromOctets,
  getClass,
  isPrivate,
  networkAddress,
  networkInfo,
  planSubnets,
  type IpClass,
  type NetworkInfo,
  type SubnetPlan,
} from './ipv4'
import type { Groups } from './ipv6'
import type { Rng } from './random'

/**
 * Versie van de opgavegenerators. Staat als &v=... in elke link, zodat een gedeelde link die met een
 * oudere versie gemaakt is een melding toont (dezelfde seed kan dan een andere opgave geven, issue #22).
 * Verhoog dit getal bij ELKE wijziging die de opgave voor een seed verandert; de snapshot-test in
 * tests/generators.test.ts faalt tot dan.
 */
export const GENERATOR_VERSION = 3

/** 1 = classful (/8, /16, /24), 2 = grens in het laatste octet (/24-/30), 3 = willekeurige prefix. */
export type Level = 1 | 2 | 3

export const LEVELS: readonly Level[] = [1, 2, 3]


export type Direction = 'dec2bin' | 'bin2dec'

export interface BinaryExercise {
  ip: number
  prefix: number
  direction: Direction
}

export interface AnalyzeExercise {
  ip: number
  prefix: number
  /** Toon het masker als 255.255.255.0 (dotted) of als /24 (cidr). */
  maskNotation: 'dotted' | 'cidr'
  answer: NetworkInfo & { ipClass: IpClass; isPrivate: boolean }
}

export interface SubnetExercise {
  network: number
  prefix: number
  requested: number
  plan: SubnetPlan
  /** Indexen (vanaf 0) van de subnetten die de student volledig moet uitschrijven; de student ziet ze als subnet 1, 2, ... */
  askIndices: number[]
  /** Toon het huidige masker als 255.255.0.0 (dotted) of als /16 (cidr). */
  maskNotation: 'dotted' | 'cidr'
}

// ---------------------------------------------------------------------------
// Adressen

/** Eerste octet voor klasse A/B/C, zonder 0.x.x.x en 127.x.x.x. */
function firstOctetFor(rng: Rng, cls: 'A' | 'B' | 'C'): number {
  if (cls === 'A') return rng.int(1, 126)
  if (cls === 'B') return rng.int(128, 191)
  return rng.int(192, 223)
}

/** Speciale bereiken die geen goed voorbeeld zijn van "publiek" of "privaat". */
export function isSpecial(ip: number): boolean {
  const [a, b] = [ip >>> 24, (ip >>> 16) & 255]
  return (
    a === 0 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) || // link-local (APIPA)
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 192 && b === 0) || // 192.0.0.0/24 en 192.0.2.0/24
    (a === 198 && (b === 18 || b === 19 || b === 51)) || // benchmarking en documentatie
    (a === 203 && b === 0) // documentatie
  )
}

function privateAddress(rng: Rng, cls: 'A' | 'B' | 'C'): number {
  if (cls === 'A') return fromOctets([10, rng.int(0, 255), rng.int(0, 255), rng.int(0, 255)])
  if (cls === 'B') return fromOctets([172, rng.int(16, 31), rng.int(0, 255), rng.int(0, 255)])
  return fromOctets([192, 168, rng.int(0, 255), rng.int(0, 255)])
}

/** Willekeurig unicast-adres in klasse A, B of C; ongeveer de helft privaat. */
export function randomAddress(rng: Rng, cls: 'A' | 'B' | 'C' = rng.pick(['A', 'B', 'C'] as const)): number {
  if (rng.chance(0.5)) return privateAddress(rng, cls)
  for (;;) {
    const ip = fromOctets([firstOctetFor(rng, cls), rng.int(0, 255), rng.int(0, 255), rng.int(0, 255)])
    if (!isPrivate(ip) && !isSpecial(ip)) return ip
  }
}

/**
 * Prefix volgens niveau, altijd binnen de regel van isSubnettingAllowed:
 * tussen de standaardprefix van de klasse (nooit supernetting) en /30.
 */
function prefixFor(rng: Rng, level: Level, ip: number): number {
  const min = minPrefix(ip)!
  if (level === 1) return min
  if (level === 2) return rng.int(Math.max(24, min), MAX_USABLE_PREFIX)
  // Niveau 3: bij voorkeur een grens midden in een octet, dat is het interessantste.
  for (;;) {
    const p = rng.int(min, MAX_USABLE_PREFIX)
    if (p % 8 !== 0 || rng.chance(0.15)) return p
  }
}

// ---------------------------------------------------------------------------
// Oefening 1: binair <-> decimaal

export function generateBinary(rng: Rng, level: Level, direction?: Direction): BinaryExercise {
  const ip = randomAddress(rng)
  return {
    ip,
    prefix: prefixFor(rng, level, ip),
    direction: direction ?? rng.pick(['dec2bin', 'bin2dec'] as const),
  }
}

// ---------------------------------------------------------------------------
// Oefening 2: adresanalyse

export function generateAnalyze(rng: Rng, level: Level): AnalyzeExercise {
  const base = randomAddress(rng)
  const prefix = prefixFor(rng, level, base)
  const network = networkAddress(base, prefix)
  // Af en toe het netwerkadres zelf geven, anders een bruikbaar hostadres (nooit de broadcast).
  // Bij grote netwerken (bv. /8) kan het hostadres in een speciaal bereik vallen (100.64.0.0/10 ...):
  // opnieuw trekken, want publiek/privaat is daar niet eenduidig.
  let ip = network
  if (!rng.chance(0.2)) {
    do {
      ip = network + rng.int(1, 2 ** (32 - prefix) - 2)
    } while (isSpecial(ip))
  }
  return {
    ip,
    prefix,
    maskNotation: level === 1 || rng.chance(0.5) ? 'dotted' : 'cidr',
    answer: { ...networkInfo(ip, prefix), ipClass: getClass(ip), isPrivate: isPrivate(ip) },
  }
}

// ---------------------------------------------------------------------------
// Oefening 3: subnetten (FLSM)

const SUBNET_SETTINGS: Record<Level, { prefixes: readonly number[]; maxRequested: number }> = {
  1: { prefixes: [24], maxRequested: 8 },
  2: { prefixes: [16, 24], maxRequested: 32 },
  3: { prefixes: Array.from({ length: 19 }, (_, i) => i + 8), maxRequested: 64 }, // /8 - /26
}

/** Kies welke subnetten de student moet uitschrijven: alle als het er weinig zijn, anders een selectie. */
function chooseIndices(rng: Rng, count: number): number[] {
  if (count <= 4) return Array.from({ length: count }, (_, i) => i)
  const picked = new Set([0, 1, count - 1, rng.int(2, count - 2)])
  return [...picked].sort((a, b) => a - b)
}

export function generateSubnet(rng: Rng, level: Level): SubnetExercise {
  const settings = SUBNET_SETTINGS[level]
  // Eerst de klasse (gelijk verdeeld), dan een prefix die voor die klasse geen supernetting is
  // (zie isSubnettingAllowed; planSubnets controleert dit nog eens). Andersom kwam klasse C op
  // niveau Expert maar in ±5% van de opgaves voor (issue #20).
  const cls = level === 1 ? 'C' : rng.pick(['A', 'B', 'C'] as const)
  const prefix = rng.pick(settings.prefixes.filter((p) => p >= defaultPrefix(cls)!))
  // Subnetting doe je enkel op private adressen (RFC 1918): 10.0.0.0/8 (A), 172.16.0.0/12 (B),
  // 192.168.0.0/16 (C). Omdat de prefix nooit korter is dan de standaardprefix van de klasse,
  // liggen ook alle subnetten volledig in het privébereik.
  const network = networkAddress(privateAddress(rng, cls), prefix)
  const maxBits = Math.min(MAX_USABLE_PREFIX - prefix, Math.log2(settings.maxRequested))
  // Meestal geen macht van 2, zodat de student moet afronden naar boven.
  const requested = rng.chance(0.3) ? 2 ** rng.int(1, maxBits) : rng.int(3, 2 ** maxBits - 1)
  const plan = planSubnets(network, prefix, requested)
  const askIndices = chooseIndices(rng, plan.subnetCount)
  const maskNotation = level === 1 || rng.chance(0.5) ? 'dotted' : 'cidr'
  return { network, prefix, requested, plan, askIndices, maskNotation }
}

// ---------------------------------------------------------------------------
// Oefening 4: IPv6 verkorten

export interface Ipv6Exercise {
  /** De 8 blokken van het adres. */
  groups: Groups
  /** Opgave in hoofdletters tonen (enkel op niveau Expert, om te tonen dat het niet uitmaakt). */
  upper: boolean
}

/** Willekeurig blok verschillend van 0, met 1 tot 4 hexadecimale cijfers (dus vaak voorloopnullen). */
function ipv6Group(rng: Rng, minDigits: number): number {
  const digits = rng.int(minDigits, 4)
  return rng.int(digits === 1 ? 1 : 16 ** (digits - 1), 16 ** digits - 1)
}

/** Waar staan de 0-blokken? (true = 0-blok) */
function zeroLayout(rng: Rng, level: Level): boolean[] {
  const zeros = Array<boolean>(8).fill(false)
  const run = (start: number, length: number) => {
    for (let i = start; i < start + length; i++) zeros[i] = true
  }
  if (level === 1) {
    // Eén reeks van 2-4 nullen na de prefix (blok 3 en verder).
    const length = rng.int(2, 4)
    run(rng.int(2, 7 - length), length)
  } else if (level === 2) {
    // Twee reeksen nullen (1-3 blokken), gescheiden door minstens één blok.
    for (;;) {
      zeros.fill(false)
      const a = rng.int(1, 3)
      const b = rng.int(1, 3)
      const startA = rng.int(2, 5)
      const startB = startA + a + 1 + rng.int(0, 2)
      if (startB + b <= 8 && !(a === 1 && b === 1)) {
        run(startA, a)
        run(startB, b)
        break
      }
    }
  } else {
    // Expert: de lastige gevallen.
    const pattern = rng.pick(['start', 'end', 'tie', 'singles', 'mixed'] as const)
    if (pattern === 'start') run(0, rng.int(2, 6))
    else if (pattern === 'end') {
      const length = rng.int(2, 5)
      run(8 - length, length)
    } else if (pattern === 'tie') {
      // Twee even lange reeksen: elk is goed; de kortste schrijfwijze kiest de eerste.
      const length = rng.int(2, 3)
      const startA = rng.int(0, 1)
      run(startA, length)
      run(startA + length + 1, length)
    } else if (pattern === 'singles') {
      // Enkel losse 0-blokken: :: mag ook één blok vervangen.
      for (const i of [rng.int(1, 2), rng.int(4, 5), 7].slice(0, rng.int(2, 3))) zeros[i] = true
    } else {
      for (let i = 0; i < 8; i++) zeros[i] = rng.chance(0.4)
      if (zeros.every(Boolean)) zeros[rng.int(0, 7)] = false
      if (!zeros.some(Boolean)) zeros[rng.int(0, 7)] = true
    }
  }
  return zeros
}

/** Gekende prefixen voor de eerste twee blokken (als die geen 0-blok zijn). */
function ipv6Prefix(rng: Rng, level: Level): [number, number] {
  if (level === 1) return [0x2001, 0x0db8] // documentatieprefix 2001:db8::/32
  return rng.pick([
    () => [0x2001, 0x0db8] as [number, number],
    () => [0x2a02, ipv6Group(rng, 1)] as [number, number], // België (RIPE)
    () => [0xfd00 + rng.int(0, 255), ipv6Group(rng, 1)] as [number, number], // unique local
    () => [0x2001, ipv6Group(rng, 1)] as [number, number],
  ])()
}

export function generateIpv6(rng: Rng, level: Level): Ipv6Exercise {
  const zeros = zeroLayout(rng, level)
  const prefix = ipv6Prefix(rng, level)
  // Basis: blokken met meestal 2-4 cijfers; daarna ook blokken van één cijfer (0001, 000a).
  const groups = zeros.map((zero, i) => (zero ? 0 : i < 2 ? prefix[i] : ipv6Group(rng, level === 1 ? 2 : 1)))
  // Altijd minstens één blok met voorloopnullen (naast de 0-blokken), anders oefent regel 1 niets.
  const candidates = groups.map((_, i) => i).filter((i) => groups[i] !== 0 && i >= 2)
  if (!groups.some((g) => g !== 0 && g < 0x1000) && candidates.length > 0) {
    groups[rng.pick(candidates)] = rng.int(1, 0xfff)
  }
  return { groups, upper: level === 3 && rng.chance(0.3) }
}
