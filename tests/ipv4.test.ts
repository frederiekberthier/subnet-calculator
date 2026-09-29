import { describe, expect, it } from 'vitest'
import {
  bitsNeeded,
  broadcastAddress,
  defaultPrefix,
  firstHost,
  formatBinary,
  formatIp,
  getClass,
  hostCount,
  interestingOctet,
  isPrivate,
  isSubnettingAllowed,
  isValidMask,
  lastHost,
  magicNumber,
  maskToPrefix,
  minPrefix,
  networkAddress,
  networkInfo,
  parseBinaryIp,
  parseBinaryOctet,
  parseIp,
  parseMask,
  planSubnets,
  prefixToMask,
  subnetAt,
  toBinaryOctets,
} from '../src/lib/ipv4'

const ip = (s: string) => {
  const v = parseIp(s)
  if (v === null) throw new Error(`ongeldig testadres ${s}`)
  return v
}

describe('parseIp / formatIp', () => {
  it('parset geldige adressen', () => {
    expect(parseIp('192.168.1.1')).toBe(0xc0a80101)
    expect(parseIp('0.0.0.0')).toBe(0)
    expect(parseIp('255.255.255.255')).toBe(0xffffffff)
    expect(parseIp(' 10.0.0.1 ')).toBe(0x0a000001)
    expect(parseIp('010.001.000.001')).toBe(0x0a010001)
  })

  it('weigert ongeldige adressen', () => {
    for (const s of ['', '1.2.3', '1.2.3.4.5', '256.0.0.1', '1.2.3.-4', 'a.b.c.d', '1..2.3', '1.2.3.1234']) {
      expect(parseIp(s), s).toBeNull()
    }
  })

  it('formatIp is de inverse van parseIp', () => {
    for (const s of ['0.0.0.0', '172.16.254.1', '255.255.255.255', '128.0.0.0']) {
      expect(formatIp(ip(s))).toBe(s)
    }
  })
})

describe('binaire omzetting', () => {
  it('zet om naar binaire octetten', () => {
    expect(toBinaryOctets(ip('192.168.1.10'))).toEqual(['11000000', '10101000', '00000001', '00001010'])
    expect(formatBinary(ip('255.255.240.0'))).toBe('11111111.11111111.11110000.00000000')
  })

  it('parset binaire octetten en adressen', () => {
    expect(parseBinaryOctet('10101000')).toBe(168)
    expect(parseBinaryOctet('0')).toBe(0)
    expect(parseBinaryOctet('101010001')).toBeNull()
    expect(parseBinaryOctet('10201')).toBeNull()
    expect(parseBinaryIp('11000000.10101000.00000001.00001010')).toBe(ip('192.168.1.10'))
    expect(parseBinaryIp('11000000.10101000.00000001')).toBeNull()
  })
})

describe('subnetmaskers', () => {
  it('prefix ↔ masker', () => {
    expect(formatIp(prefixToMask(0))).toBe('0.0.0.0')
    expect(formatIp(prefixToMask(8))).toBe('255.0.0.0')
    expect(formatIp(prefixToMask(23))).toBe('255.255.254.0')
    expect(formatIp(prefixToMask(26))).toBe('255.255.255.192')
    expect(formatIp(prefixToMask(32))).toBe('255.255.255.255')
    for (let p = 0; p <= 32; p++) expect(maskToPrefix(prefixToMask(p))).toBe(p)
  })

  it('weigert ongeldige prefixen', () => {
    expect(() => prefixToMask(33)).toThrow()
    expect(() => prefixToMask(-1)).toThrow()
  })

  it('herkent ongeldige maskers', () => {
    expect(isValidMask(ip('255.255.255.0'))).toBe(true)
    expect(isValidMask(ip('255.0.255.0'))).toBe(false)
    expect(isValidMask(ip('255.255.255.1'))).toBe(false)
    expect(maskToPrefix(ip('0.255.255.255'))).toBeNull()
  })

  it('parseMask aanvaardt dotted decimal en CIDR', () => {
    expect(parseMask('255.255.255.0')).toBe(24)
    expect(parseMask('/26')).toBe(26)
    expect(parseMask('19')).toBe(19)
    expect(parseMask('/33')).toBeNull()
    expect(parseMask('255.0.255.0')).toBeNull()
  })
})

describe('adresanalyse', () => {
  it('192.168.10.77/26', () => {
    const info = networkInfo(ip('192.168.10.77'), 26)
    expect(formatIp(info.network)).toBe('192.168.10.64')
    expect(formatIp(info.firstHost)).toBe('192.168.10.65')
    expect(formatIp(info.lastHost)).toBe('192.168.10.126')
    expect(formatIp(info.broadcast)).toBe('192.168.10.127')
    expect(info.hostCount).toBe(62)
  })

  it('172.20.130.5/19 (grens in 3e octet)', () => {
    const a = ip('172.20.130.5')
    expect(formatIp(networkAddress(a, 19))).toBe('172.20.128.0')
    expect(formatIp(broadcastAddress(a, 19))).toBe('172.20.159.255')
    expect(formatIp(firstHost(a, 19))).toBe('172.20.128.1')
    expect(formatIp(lastHost(a, 19))).toBe('172.20.159.254')
    expect(hostCount(19)).toBe(8190)
  })

  it('werkt met hoge adressen (unsigned)', () => {
    expect(formatIp(broadcastAddress(ip('10.1.2.3'), 8))).toBe('10.255.255.255')
    expect(formatIp(networkAddress(ip('200.100.50.25'), 30))).toBe('200.100.50.24')
    expect(formatIp(networkAddress(ip('255.255.255.255'), 24))).toBe('255.255.255.0')
  })

  it('/31 en /32 hebben geen bruikbare adressen (maximum /30)', () => {
    expect(hostCount(30)).toBe(2)
    expect(hostCount(31)).toBe(0)
    expect(hostCount(32)).toBe(0)
    expect(formatIp(firstHost(ip('10.0.0.1'), 30))).toBe('10.0.0.1')
    expect(formatIp(lastHost(ip('10.0.0.1'), 30))).toBe('10.0.0.2')
    expect(() => firstHost(ip('10.0.0.1'), 31)).toThrow()
    expect(() => lastHost(ip('10.0.0.1'), 32)).toThrow()
    expect(() => networkInfo(ip('10.0.0.1'), 31)).toThrow()
  })
})

describe('klassen en privaat/publiek', () => {
  it('bepaalt de klasse', () => {
    expect(getClass(ip('1.0.0.0'))).toBe('A')
    expect(getClass(ip('127.255.255.255'))).toBe('A')
    expect(getClass(ip('128.0.0.0'))).toBe('B')
    expect(getClass(ip('191.255.0.0'))).toBe('B')
    expect(getClass(ip('192.0.0.0'))).toBe('C')
    expect(getClass(ip('223.255.255.0'))).toBe('C')
    expect(getClass(ip('224.0.0.1'))).toBe('D')
    expect(getClass(ip('239.1.1.1'))).toBe('D')
    expect(getClass(ip('240.0.0.1'))).toBe('E')
    expect(defaultPrefix('B')).toBe(16)
    expect(defaultPrefix('D')).toBeNull()
  })

  it('herkent RFC 1918 privé-adressen en hun grenzen', () => {
    expect(isPrivate(ip('10.0.0.1'))).toBe(true)
    expect(isPrivate(ip('172.16.0.0'))).toBe(true)
    expect(isPrivate(ip('172.31.255.255'))).toBe(true)
    expect(isPrivate(ip('172.15.255.255'))).toBe(false)
    expect(isPrivate(ip('172.32.0.0'))).toBe(false)
    expect(isPrivate(ip('192.168.5.5'))).toBe(true)
    expect(isPrivate(ip('192.169.0.1'))).toBe(false)
    expect(isPrivate(ip('8.8.8.8'))).toBe(false)
  })
})

describe('subnetten (FLSM)', () => {
  it('bitsNeeded', () => {
    expect([1, 2, 3, 4, 5, 8, 9, 16, 17, 1000].map(bitsNeeded)).toEqual([0, 1, 2, 2, 3, 3, 4, 4, 5, 10])
    expect(() => bitsNeeded(0)).toThrow()
  })

  it('172.16.0.0/16 in 5 subnetten → /19', () => {
    const plan = planSubnets(ip('172.16.0.0'), 16, 5)
    expect(plan.borrowedBits).toBe(3)
    expect(plan.newPrefix).toBe(19)
    expect(plan.subnetCount).toBe(8)
    expect(plan.hostsPerSubnet).toBe(8190)
    expect(formatIp(subnetAt(plan, 1).network)).toBe('172.16.32.0')
    const last = subnetAt(plan, 7)
    expect(formatIp(last.network)).toBe('172.16.224.0')
    expect(formatIp(last.broadcast)).toBe('172.16.255.255')
  })

  it('192.168.1.0/24 in 4 subnetten → /26', () => {
    const plan = planSubnets(ip('192.168.1.0'), 24, 4)
    expect(plan.newPrefix).toBe(26)
    expect(plan.blockSize).toBe(64)
    const s = subnetAt(plan, 2)
    expect(formatIp(s.network)).toBe('192.168.1.128')
    expect(formatIp(s.firstHost)).toBe('192.168.1.129')
    expect(formatIp(s.lastHost)).toBe('192.168.1.190')
    expect(formatIp(s.broadcast)).toBe('192.168.1.191')
  })

  it('normaliseert een host-adres naar het netwerkadres', () => {
    const plan = planSubnets(ip('10.20.30.40'), 8, 3)
    expect(formatIp(plan.network)).toBe('10.0.0.0')
    expect(formatIp(subnetAt(plan, 3).network)).toBe('10.192.0.0')
  })

  it('weigert onmogelijke splitsingen en indexen', () => {
    expect(() => planSubnets(ip('192.168.1.0'), 24, 128)).toThrow()
    expect(planSubnets(ip('192.168.1.0'), 24, 64).newPrefix).toBe(30)
    const plan = planSubnets(ip('192.168.1.0'), 24, 2)
    expect(() => subnetAt(plan, 2)).toThrow()
  })

  it('magisch getal en interessant octet', () => {
    expect([8, 19, 24, 26].map(interestingOctet)).toEqual([0, 2, 2, 3])
    expect(magicNumber(19)).toBe(32)
    expect(magicNumber(24)).toBe(1)
    expect(magicNumber(26)).toBe(64)
    expect(magicNumber(12)).toBe(16)
  })
})

describe('geen supernetting (enkel subnetting)', () => {
  it('minPrefix is de standaardprefix van de klasse', () => {
    expect(minPrefix(ip('10.1.2.3'))).toBe(8)
    expect(minPrefix(ip('172.16.0.1'))).toBe(16)
    expect(minPrefix(ip('192.168.1.1'))).toBe(24)
    expect(minPrefix(ip('224.0.0.1'))).toBeNull()
    expect(minPrefix(ip('240.0.0.1'))).toBeNull()
  })

  it('isSubnettingAllowed: tussen standaardprefix en /30', () => {
    expect(isSubnettingAllowed(ip('192.168.1.0'), 24)).toBe(true)
    expect(isSubnettingAllowed(ip('192.168.1.0'), 30)).toBe(true)
    expect(isSubnettingAllowed(ip('192.168.1.0'), 22)).toBe(false) // supernetting
    expect(isSubnettingAllowed(ip('192.168.1.0'), 31)).toBe(false) // geen bruikbare adressen
    expect(isSubnettingAllowed(ip('172.16.0.0'), 16)).toBe(true)
    expect(isSubnettingAllowed(ip('172.16.0.0'), 12)).toBe(false)
    expect(isSubnettingAllowed(ip('10.0.0.0'), 8)).toBe(true)
    expect(isSubnettingAllowed(ip('10.0.0.0'), 7)).toBe(false)
    expect(isSubnettingAllowed(ip('224.0.0.0'), 24)).toBe(false) // klasse D
  })

  it('planSubnets weigert een gesupernet startnetwerk', () => {
    expect(() => planSubnets(ip('192.168.0.0'), 22, 4)).toThrow()
    expect(() => planSubnets(ip('172.16.0.0'), 12, 4)).toThrow()
    expect(() => planSubnets(ip('224.0.0.0'), 24, 2)).toThrow()
    expect(planSubnets(ip('192.168.0.0'), 24, 4).newPrefix).toBe(26)
  })
})
