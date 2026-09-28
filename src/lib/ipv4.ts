// Rekenkern voor IPv4. Puur (geen DOM), zodat alles met unit tests te controleren is.
// Een adres wordt intern voorgesteld als een 32-bit unsigned integer.

export type IpClass = 'A' | 'B' | 'C' | 'D' | 'E'

export interface NetworkInfo {
  prefix: number
  mask: number
  network: number
  broadcast: number
  firstHost: number
  lastHost: number
  hostCount: number
}

export interface SubnetPlan {
  /** Oorspronkelijk netwerk (al genormaliseerd naar het netwerkadres). */
  network: number
  prefix: number
  requested: number
  borrowedBits: number
  newPrefix: number
  subnetCount: number
  /** Aantal adressen per subnet (2^hostbits). */
  blockSize: number
  hostsPerSubnet: number
}

const MAX = 0xffffffff

/** Parse "a.b.c.d" (decimaal) naar een getal, of null als het geen geldig adres is. */
export function parseIp(text: string): number | null {
  const parts = text.trim().split('.')
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    const p = part.trim()
    if (!/^\d{1,3}$/.test(p)) return null
    const n = Number(p)
    if (n > 255) return null
    value = value * 256 + n
  }
  return value
}

export function toOctets(ip: number): [number, number, number, number] {
  return [(ip >>> 24) & 255, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255]
}

export function fromOctets(octets: readonly number[]): number {
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
}

export function formatIp(ip: number): string {
  return toOctets(ip).join('.')
}

export function octetToBinary(octet: number): string {
  return octet.toString(2).padStart(8, '0')
}

export function toBinaryOctets(ip: number): string[] {
  return toOctets(ip).map(octetToBinary)
}

/** "11000000.10101000.00000001.00000001" */
export function formatBinary(ip: number): string {
  return toBinaryOctets(ip).join('.')
}

/** Parse één binair octet (1 tot 8 bits), of null. */
export function parseBinaryOctet(text: string): number | null {
  const t = text.trim()
  if (!/^[01]{1,8}$/.test(t)) return null
  return parseInt(t, 2)
}

/** Parse een binair adres met 4 octetten gescheiden door punten, of null. */
export function parseBinaryIp(text: string): number | null {
  const parts = text.trim().split('.')
  if (parts.length !== 4) return null
  const octets = parts.map(parseBinaryOctet)
  if (octets.some((o) => o === null)) return null
  return fromOctets(octets as number[])
}

export function prefixToMask(prefix: number): number {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new RangeError(`Ongeldige prefix: ${prefix}`)
  }
  // << 32 is in JavaScript een no-op, daarom /0 apart.
  return prefix === 0 ? 0 : (MAX << (32 - prefix)) >>> 0
}

/** Prefixlengte van een masker, of null als het masker niet aaneengesloten is. */
export function maskToPrefix(mask: number): number | null {
  const inverted = ~mask >>> 0
  // Een geldig masker is 1-en gevolgd door 0-en: de inverse + 1 is dan een macht van 2.
  if ((inverted & (inverted + 1)) !== 0) return null
  return Math.clz32(inverted)
}

export function isValidMask(mask: number): boolean {
  return maskToPrefix(mask) !== null
}

/** Parse "255.255.255.0", "/24" of "24" naar een prefixlengte, of null. */
export function parseMask(text: string): number | null {
  const t = text.trim()
  const cidr = /^\/?\s*(\d{1,2})$/.exec(t)
  if (cidr) {
    const p = Number(cidr[1])
    return p <= 32 ? p : null
  }
  const mask = parseIp(t)
  return mask === null ? null : maskToPrefix(mask)
}

export function formatCidr(ip: number, prefix: number): string {
  return `${formatIp(ip)}/${prefix}`
}

export function networkAddress(ip: number, prefix: number): number {
  return (ip & prefixToMask(prefix)) >>> 0
}

export function broadcastAddress(ip: number, prefix: number): number {
  return (ip | ~prefixToMask(prefix)) >>> 0
}

// /31 (point-to-point, RFC 3021) en /32 (één host) hebben geen apart netwerk- of broadcastadres.
export function firstHost(ip: number, prefix: number): number {
  const net = networkAddress(ip, prefix)
  return prefix >= 31 ? net : net + 1
}

export function lastHost(ip: number, prefix: number): number {
  const bc = broadcastAddress(ip, prefix)
  return prefix >= 31 ? bc : bc - 1
}

export function hostCount(prefix: number): number {
  if (prefix === 32) return 1
  if (prefix === 31) return 2
  return 2 ** (32 - prefix) - 2
}

export function networkInfo(ip: number, prefix: number): NetworkInfo {
  return {
    prefix,
    mask: prefixToMask(prefix),
    network: networkAddress(ip, prefix),
    broadcast: broadcastAddress(ip, prefix),
    firstHost: firstHost(ip, prefix),
    lastHost: lastHost(ip, prefix),
    hostCount: hostCount(prefix),
  }
}

export function getClass(ip: number): IpClass {
  const first = ip >>> 24
  if (first < 128) return 'A'
  if (first < 192) return 'B'
  if (first < 224) return 'C'
  if (first < 240) return 'D'
  return 'E'
}

/** Standaard (classful) prefix voor klasse A/B/C; null voor D en E. */
export function defaultPrefix(cls: IpClass): number | null {
  return { A: 8, B: 16, C: 24, D: null, E: null }[cls]
}

const PRIVATE_RANGES: ReadonlyArray<[number, number]> = [
  [0x0a000000, 8], // 10.0.0.0/8
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0a80000, 16], // 192.168.0.0/16
]

/** Privaat volgens RFC 1918. */
export function isPrivate(ip: number): boolean {
  return PRIVATE_RANGES.some(([net, prefix]) => networkAddress(ip, prefix) === net)
}

/** Aantal bits nodig om minstens n subnetten te maken: ceil(log2 n), zonder afrondingsfouten. */
export function bitsNeeded(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError(`Ongeldig aantal: ${n}`)
  let bits = 0
  while (2 ** bits < n) bits++
  return bits
}

/**
 * Splits een netwerk in minstens `requested` even grote subnetten (FLSM).
 * Gooit een fout als er niet genoeg hostbits zijn (minstens 2 hostbits blijven over).
 */
export function planSubnets(ip: number, prefix: number, requested: number): SubnetPlan {
  const borrowedBits = bitsNeeded(requested)
  const newPrefix = prefix + borrowedBits
  if (newPrefix > 30) {
    throw new RangeError(`Niet mogelijk: /${prefix} kan niet in ${requested} subnetten gesplitst worden`)
  }
  return {
    network: networkAddress(ip, prefix),
    prefix,
    requested,
    borrowedBits,
    newPrefix,
    subnetCount: 2 ** borrowedBits,
    blockSize: 2 ** (32 - newPrefix),
    hostsPerSubnet: hostCount(newPrefix),
  }
}

/** Subnet met index i (0-gebaseerd) uit een plan. */
export function subnetAt(plan: SubnetPlan, index: number): NetworkInfo {
  if (!Number.isInteger(index) || index < 0 || index >= plan.subnetCount) {
    throw new RangeError(`Subnetindex buiten bereik: ${index}`)
  }
  return networkInfo(plan.network + index * plan.blockSize, plan.newPrefix)
}

/** Octet (0-3) met de laatste netwerkbit: daar verspringen de subnetten. */
export function interestingOctet(prefix: number): number {
  return Math.max(0, Math.floor((prefix - 1) / 8))
}

/** "Magisch getal": sprong tussen subnetten in het interessante octet (256 - maskeroctet). */
export function magicNumber(prefix: number): number {
  return 256 - toOctets(prefixToMask(prefix))[interestingOctet(prefix)]
}
