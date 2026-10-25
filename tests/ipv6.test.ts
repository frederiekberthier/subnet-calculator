import { describe, expect, it } from 'vitest'
import {
  checkShortened,
  compress,
  formatFull,
  parseIpv6,
  shortest,
  stripLeadingZeros,
  validShortenings,
  zeroRuns,
  type Groups,
} from '../src/lib/ipv6'

const groups = (text: string): Groups => {
  const g = parseIpv6(text)
  if (g === null) throw new Error(`ongeldig testadres ${text}`)
  return g
}
const status = (answer: string, address: string) => {
  const r = checkShortened(answer, groups(address))
  return r.status === 'format' ? `format:${r.hint}` : r.status
}

const EXAMPLE = '2001:0db8:0000:0000:0000:ff00:0042:8329'

describe('parseIpv6 / formatFull', () => {
  it('leest volledige en verkorte adressen', () => {
    expect(groups(EXAMPLE)).toEqual([0x2001, 0xdb8, 0, 0, 0, 0xff00, 0x42, 0x8329])
    expect(groups('2001:db8::ff00:42:8329')).toEqual(groups(EXAMPLE))
    expect(groups('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1])
    expect(groups('fe80::')).toEqual([0xfe80, 0, 0, 0, 0, 0, 0, 0])
    expect(groups('2001:DB8::1')).toEqual(groups('2001:db8::1'))
    expect(groups('2001:db8::1:1:1:1:1')).toEqual([0x2001, 0xdb8, 0, 1, 1, 1, 1, 1]) // :: voor één blok
  })

  it('weigert ongeldige adressen', () => {
    for (const bad of ['', '2001:db8', '2001:db8::1::2', '2001:db8:::1', '1:2:3:4:5:6:7:8:9', '2001:0db8g::1', '12345::1', '1:2:3:4:5:6:7::8', '2001:db8:', ':1:2:3:4:5:6:7']) {
      expect(parseIpv6(bad), bad).toBeNull()
    }
  })

  it('formatFull schrijft 8 blokken van 4 cijfers', () => {
    expect(formatFull(groups('2001:db8::1'))).toBe('2001:0db8:0000:0000:0000:0000:0000:0001')
    expect(formatFull(groups('fe80::ab'), true)).toBe('FE80:0000:0000:0000:0000:0000:0000:00AB')
  })
})

describe('de twee regels', () => {
  it('regel 1: voorloopnullen weglaten', () => {
    expect(stripLeadingZeros(groups(EXAMPLE))).toBe('2001:db8:0:0:0:ff00:42:8329')
  })

  it('nulreeksen vinden', () => {
    expect(zeroRuns(groups(EXAMPLE))).toEqual([{ start: 2, length: 3 }])
    expect(zeroRuns(groups('2001:0:0:1:0:0:0:1'))).toEqual([
      { start: 1, length: 2 },
      { start: 4, length: 3 },
    ])
    expect(zeroRuns(groups('2001:db8:1:2:3:4:5:6'))).toEqual([])
  })

  it('regel 2: :: op een reeks; kortste = langste reeks, bij gelijke lengte de eerste', () => {
    const g = groups('2001:0:0:1:0:0:0:1')
    expect(compress(g, { start: 1, length: 2 })).toBe('2001::1:0:0:0:1')
    expect(shortest(g)).toBe('2001:0:0:1::1')
    expect(shortest(groups('2001:0:0:1:0:0:2:3'))).toBe('2001::1:0:0:2:3')
    expect(shortest(groups('0:0:0:0:0:0:0:1'))).toBe('::1')
    expect(shortest(groups('fe80:0:0:0:0:0:0:0'))).toBe('fe80::')
    expect(validShortenings(g)).toEqual(['2001::1:0:0:0:1', '2001:0:0:1::1'])
  })
})

describe('checkShortened (regels van de opleiding)', () => {
  it('juist: kortste vorm, andere reeks, één blok, hoofdletters, spaties rond', () => {
    expect(status('2001:db8::ff00:42:8329', EXAMPLE)).toBe('ok')
    expect(status('  2001:DB8::FF00:42:8329 ', EXAMPLE)).toBe('ok')
    expect(status('2001::1:0:0:0:1', '2001:0000:0000:0001:0000:0000:0000:0001')).toBe('ok') // elke reeks is goed
    expect(status('2001:0:0:1::1', '2001:0000:0000:0001:0000:0000:0000:0001')).toBe('ok')
    expect(status('2001:db8::1:1:1:1:1', '2001:0db8:0000:0001:0001:0001:0001:0001')).toBe('ok') // één blok
    expect(status('::1', '0000:0000:0000:0000:0000:0000:0000:0001')).toBe('ok')
    expect(status('fe80::', 'fe80:0000:0000:0000:0000:0000:0000:0000')).toBe('ok')
  })

  it('leeg', () => {
    expect(status('  ', EXAMPLE)).toBe('empty')
  })

  it('fout adres', () => {
    expect(status('2001:db8::ff00:42:8328', EXAMPLE)).toBe('wrong')
    expect(status('2001:db8::42:8329', EXAMPLE)).toBe('wrong') // blok vergeten
  })

  it(':: twee keer', () => {
    expect(status('2001::1::1', '2001:0000:0000:0001:0000:0000:0000:0001')).toBe('format:ipv6Once')
  })

  it('voorloopnullen niet weggelaten', () => {
    expect(status('2001:0db8::ff00:42:8329', EXAMPLE)).toBe('format:ipv6LeadingZeros')
    expect(status('2001:db8::ff00:0042:8329', EXAMPLE)).toBe('format:ipv6LeadingZeros')
  })

  it('geen :: gebruikt terwijl er nullen zijn', () => {
    expect(status('2001:db8:0:0:0:ff00:42:8329', EXAMPLE)).toBe('format:ipv6UseDoubleColon')
  })

  it(':: vervangt maar een deel van een reeks nullen', () => {
    expect(status('2001:db8::0:ff00:42:8329', EXAMPLE)).toBe('format:ipv6PartialRun')
    expect(status('2001:db8:0::ff00:42:8329', EXAMPLE)).toBe('format:ipv6PartialRun')
    expect(status('0::1', '0000:0000:0000:0000:0000:0000:0000:0001')).toBe('format:ipv6PartialRun')
  })

  it('ongeldig formaat', () => {
    expect(status('2001:db8::ff00:42:8329:x', EXAMPLE)).toBe('format:ipv6Format')
    expect(status('2001.db8', EXAMPLE)).toBe('format:ipv6Format')
    expect(status('2001:db8:::1', EXAMPLE)).toBe('format:ipv6Format')
  })
})
