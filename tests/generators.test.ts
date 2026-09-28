import { describe, expect, it } from 'vitest'
import { generateAnalyze, generateBinary, generateSubnet, LEVELS, randomAddress } from '../src/lib/generators'
import {
  broadcastAddress,
  defaultPrefix,
  getClass,
  isPrivate,
  MAX_USABLE_PREFIX,
  networkAddress,
} from '../src/lib/ipv4'
import { createRng, parseSeed } from '../src/lib/random'

const RUNS = 2000

describe('random', () => {
  it('is deterministisch per seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const c = createRng(43)
    const seqA = Array.from({ length: 10 }, () => a.next())
    expect(Array.from({ length: 10 }, () => b.next())).toEqual(seqA)
    expect(Array.from({ length: 10 }, () => c.next())).not.toEqual(seqA)
  })

  it('int blijft binnen de grenzen en haalt ze', () => {
    const rng = createRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(3, 7)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(7)
      seen.add(n)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7])
  })

  it('parseSeed', () => {
    expect(parseSeed('123')).toBe(123)
    expect(parseSeed(null)).toBeNull()
    expect(parseSeed('abc')).toBeNull()
    expect(parseSeed('-5')).toBeNull()
    expect(parseSeed('99999999999')).toBeNull()
  })
})

describe('randomAddress', () => {
  it('geeft enkel klasse A/B/C zonder speciale bereiken, en zowel publiek als privaat', () => {
    const rng = createRng(7)
    let priv = 0
    for (let i = 0; i < RUNS; i++) {
      const ip = randomAddress(rng)
      const first = ip >>> 24
      expect(['A', 'B', 'C']).toContain(getClass(ip))
      expect(first).not.toBe(0)
      expect(first).not.toBe(127)
      expect(ip >>> 16).not.toBe((169 << 8) | 254)
      if (isPrivate(ip)) priv++
    }
    expect(priv / RUNS).toBeGreaterThan(0.35)
    expect(priv / RUNS).toBeLessThan(0.65)
  })

  it('respecteert de gevraagde klasse', () => {
    const rng = createRng(8)
    for (const cls of ['A', 'B', 'C'] as const) {
      for (let i = 0; i < 200; i++) expect(getClass(randomAddress(rng, cls))).toBe(cls)
    }
  })
})

describe('generateBinary', () => {
  it('prefix volgens niveau en beide richtingen', () => {
    const rng = createRng(11)
    const dirs = new Set<string>()
    for (let i = 0; i < RUNS; i++) {
      const ex = generateBinary(rng, 1)
      expect(ex.prefix).toBe(defaultPrefix(getClass(ex.ip)))
      dirs.add(ex.direction)
    }
    expect(dirs).toEqual(new Set(['dec2bin', 'bin2dec']))
    expect(generateBinary(rng, 2, 'bin2dec').direction).toBe('bin2dec')
  })
})

describe('generateAnalyze', () => {
  for (const level of LEVELS) {
    it(`niveau ${level}: geldige opgave met correct antwoord`, () => {
      const rng = createRng(100 + level)
      let networks = 0
      for (let i = 0; i < RUNS; i++) {
        const ex = generateAnalyze(rng, level)
        expect(ex.prefix).toBeLessThanOrEqual(MAX_USABLE_PREFIX)
        if (level === 1) expect([8, 16, 24]).toContain(ex.prefix)
        if (level === 2) expect(ex.prefix).toBeGreaterThanOrEqual(24)
        if (level === 3) expect(ex.prefix).toBeGreaterThanOrEqual(8)
        expect(ex.ip).not.toBe(broadcastAddress(ex.ip, ex.prefix))
        if (ex.ip === ex.answer.network) networks++
        expect(ex.answer.network).toBe(networkAddress(ex.ip, ex.prefix))
        expect(ex.answer.ipClass).toBe(getClass(ex.ip))
        expect(ex.answer.isPrivate).toBe(isPrivate(ex.ip))
      }
      expect(networks).toBeGreaterThan(0)
      expect(networks).toBeLessThan(RUNS / 2)
    })
  }

  it('is reproduceerbaar met dezelfde seed', () => {
    expect(generateAnalyze(createRng(5), 3)).toEqual(generateAnalyze(createRng(5), 3))
  })
})

describe('generateSubnet', () => {
  for (const level of LEVELS) {
    it(`niveau ${level}: splitsing is altijd mogelijk tot maximum /30`, () => {
      const rng = createRng(200 + level)
      for (let i = 0; i < RUNS; i++) {
        const ex = generateSubnet(rng, level)
        expect(ex.network).toBe(networkAddress(ex.network, ex.prefix))
        expect(ex.requested).toBeGreaterThanOrEqual(2)
        expect(ex.plan.newPrefix).toBeLessThanOrEqual(MAX_USABLE_PREFIX)
        expect(ex.plan.subnetCount).toBeGreaterThanOrEqual(ex.requested)
        expect(defaultPrefix(getClass(ex.network))!).toBeLessThanOrEqual(ex.prefix)
        if (level === 1) expect(ex.prefix).toBe(24)
        // Gevraagde subnetten: gesorteerd, uniek, binnen bereik, eerste en laatste inbegrepen.
        expect(ex.askIndices).toEqual([...new Set(ex.askIndices)].sort((a, b) => a - b))
        expect(ex.askIndices[0]).toBe(0)
        expect(ex.askIndices.at(-1)).toBe(ex.plan.subnetCount - 1)
        expect(ex.askIndices.length).toBeLessThanOrEqual(4)
      }
    })
  }

  it('vraagt meestal een aantal dat geen macht van 2 is', () => {
    const rng = createRng(9)
    let nonPow = 0
    for (let i = 0; i < RUNS; i++) {
      const n = generateSubnet(rng, 2).requested
      if (n & (n - 1)) nonPow++
    }
    expect(nonPow / RUNS).toBeGreaterThan(0.5)
  })
})
