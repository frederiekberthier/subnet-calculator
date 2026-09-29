import { describe, expect, it } from 'vitest'
import {
  checkBinaryOctet,
  checkChoice,
  checkDecimalOctet,
  checkInteger,
  checkIp,
  checkPrefix,
  splitAddressInput,
} from '../src/lib/check'

const status = (r: { status: string }) => r.status

describe('checkDecimalOctet', () => {
  it('juist, fout, leeg en ongeldig', () => {
    expect(status(checkDecimalOctet('168', 168))).toBe('ok')
    expect(status(checkDecimalOctet(' 007 ', 7))).toBe('ok')
    expect(status(checkDecimalOctet('169', 168))).toBe('wrong')
    expect(status(checkDecimalOctet('  ', 168))).toBe('empty')
    expect(status(checkDecimalOctet('256', 0))).toBe('format')
    expect(status(checkDecimalOctet('1a', 1))).toBe('format')
  })
})

describe('checkBinaryOctet', () => {
  it('vereist precies 8 bits', () => {
    expect(status(checkBinaryOctet('10101000', 168))).toBe('ok')
    expect(status(checkBinaryOctet('1010 1000', 168))).toBe('ok')
    expect(status(checkBinaryOctet('00000000', 0))).toBe('ok')
    expect(status(checkBinaryOctet('10101001', 168))).toBe('wrong')
    expect(status(checkBinaryOctet('1010', 10))).toBe('format')
    expect(status(checkBinaryOctet('10201000', 168))).toBe('format')
    expect(status(checkBinaryOctet('', 1))).toBe('empty')
  })
})

describe('checkPrefix', () => {
  it('aanvaardt 24 en /24', () => {
    expect(status(checkPrefix('24', 24))).toBe('ok')
    expect(status(checkPrefix('/24', 24))).toBe('ok')
    expect(status(checkPrefix('/ 24', 24))).toBe('ok')
    expect(status(checkPrefix('25', 24))).toBe('wrong')
    expect(status(checkPrefix('33', 24))).toBe('format')
    expect(status(checkPrefix('255.255.255.0', 24))).toBe('format')
  })
})

describe('checkIp', () => {
  it('vergelijkt adressen', () => {
    expect(status(checkIp('192.168.1.0', 0xc0a80100))).toBe('ok')
    expect(status(checkIp(' 192.168.001.000 ', 0xc0a80100))).toBe('ok')
    expect(status(checkIp('192.168.1.1', 0xc0a80100))).toBe('wrong')
    expect(status(checkIp('192.168.1', 0xc0a80100))).toBe('format')
  })
})

describe('checkInteger', () => {
  it('aanvaardt duizendtalscheiding', () => {
    expect(status(checkInteger('8190', 8190))).toBe('ok')
    expect(status(checkInteger('8.190', 8190))).toBe('ok')
    expect(status(checkInteger('8 190', 8190))).toBe('ok')
    expect(status(checkInteger('8191', 8190))).toBe('wrong')
    expect(status(checkInteger('abc', 1))).toBe('format')
  })
})

describe('checkChoice', () => {
  it('juist, fout en niets gekozen', () => {
    expect(status(checkChoice('B', 'B'))).toBe('ok')
    expect(status(checkChoice('C', 'B'))).toBe('wrong')
    expect(status(checkChoice(null, 'B'))).toBe('empty')
  })
})

describe('splitAddressInput (plakken, issue #11)', () => {
  it("decimaal met punten, komma's of spaties", () => {
    expect(splitAddressInput('192.168.1.10', false)).toEqual(['192', '168', '1', '10'])
    expect(splitAddressInput(' 10,0,0,1 ', false)).toEqual(['10', '0', '0', '1'])
    expect(splitAddressInput('172 16 0 0', false)).toEqual(['172', '16', '0', '0'])
    expect(splitAddressInput('255.255.240', false)).toEqual(['255', '255', '240'])
  })

  it('binair met punten of 32 bits aan één stuk', () => {
    expect(splitAddressInput('11000000.10101000.00000001.00001010', true)).toEqual(['11000000', '10101000', '00000001', '00001010'])
    expect(splitAddressInput('11000000101010000000000100001010', true)).toEqual(['11000000', '10101000', '00000001', '00001010'])
  })

  it('geen splitsing voor één byte of ongeldige tekst', () => {
    expect(splitAddressInput('192', false)).toEqual([])
    expect(splitAddressInput('10101000', true)).toEqual([])
    expect(splitAddressInput('<b>1.2.3.4</b>', false)).toEqual([])
    expect(splitAddressInput('1.2.3.x', false)).toEqual([])
  })
})
