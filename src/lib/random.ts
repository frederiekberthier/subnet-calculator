// Voorspelbare random-generator: met dezelfde seed krijg je dezelfde opgave.
// Zo kan de docent een opgave delen via ?seed=... in de URL.

export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Geheel getal in [min, max] (grenzen inbegrepen). */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  chance(p: number): boolean
}

// mulberry32: klein, snel en goed genoeg voor oefeningen.
export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    next,
    int,
    pick: (items) => items[int(0, items.length - 1)],
    chance: (p) => next() < p,
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000)
}

/** Seed uit tekst (bv. URL-parameter), of null als het geen geldig positief geheel getal is. */
export function parseSeed(text: string | null | undefined): number | null {
  if (!text || !/^\d{1,10}$/.test(text.trim())) return null
  const n = Number(text.trim())
  return n <= 0xffffffff ? n : null
}
