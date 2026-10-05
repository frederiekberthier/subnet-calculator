// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { subnetPage } from '../../src/exercises/subnet'
import { generateSubnet } from '../../src/lib/generators'
import { createRng } from '../../src/lib/random'

const SEED = 42
const LEVEL = 2

let root: HTMLElement

beforeEach(() => {
  sessionStorage.clear()
  location.hash = `#/subnetten?seed=${SEED}&niveau=${LEVEL}`
  document.body.innerHTML = '<main id="app"></main>'
  root = document.querySelector('#app')!
  subnetPage(root)
})

describe('oefening 3: subnetten genummerd vanaf 1', () => {
  // Dezelfde opgave als op de pagina (readState gebruikt dezelfde seed).
  const ex = generateSubnet(createRng(SEED), LEVEL)

  it('de invulkaarten heten subnet 1, 2, ... (interne index + 1)', () => {
    const legends = [...root.querySelectorAll('.subnet-card legend')].map((l) => l.textContent)
    expect(legends).toEqual(ex.askIndices.map((i) => `Subnet ${i + 1}`))
    expect(legends[0]).toBe('Subnet 1')
    expect(legends.at(-1)).toBe(`Subnet ${ex.plan.subnetCount}`)
  })

  it('de uitleg vermeldt dat de nummering bij subnet 1 begint', () => {
    expect(root.querySelector('.lead')!.textContent).toContain('subnet 1')
  })

  it('de oplossing (overzicht, stappen, binaire uitwerking, tabel) gebruikt nergens subnet 0', () => {
    root.querySelector<HTMLButtonElement>('[data-action="solution"]')!.click()
    const solution = root.querySelector('.solution')!
    const text = solution.textContent!
    expect(text).not.toMatch(/subnet 0\b/i)
    expect(text).toContain(`subnet 1 tot en met subnet ${ex.plan.subnetCount}`)
    const firstRow = solution.querySelector('.subnet-table tbody th')!.textContent
    expect(firstRow).toBe('1')
    const rowNumbers = [...solution.querySelectorAll('.subnet-table tbody th')].map((th) => Number(th.textContent))
    expect(rowNumbers).toEqual(Array.from({ length: ex.plan.subnetCount }, (_, i) => i + 1))
    const binaryLabels = [...solution.querySelectorAll('.at-label')].map((l) => l.textContent)
    expect(binaryLabels).toContain('Subnet 1')
    expect(binaryLabels).toContain(`Subnet ${ex.plan.subnetCount}`)
  })

  it('de gemarkeerde rijen in de tabel zijn precies de gevraagde subnetten', () => {
    root.querySelector<HTMLButtonElement>('[data-action="solution"]')!.click()
    const marked = [...root.querySelectorAll('.subnet-table tr.asked th')].map((th) => Number(th.textContent))
    expect(marked).toEqual(ex.askIndices.map((i) => i + 1))
  })
})

describe('binaire uitwerking toont alle gevraagde subnetten', () => {
  /** Eerste seed (niveau 1) waarvoor het aantal subnetten aan de voorwaarde voldoet. */
  const seedWhere = (ok: (count: number) => boolean) => {
    for (let seed = 1; seed < 10000; seed++) if (ok(generateSubnet(createRng(seed), 1).plan.subnetCount)) return seed
    throw new Error('geen seed gevonden')
  }

  for (const [title, seed] of [
    ['precies 4 subnetten (ook subnet 3)', seedWhere((c) => c === 4)],
    ['meer dan 4 subnetten (ook het willekeurige subnet)', seedWhere((c) => c > 4)],
    ['2 subnetten', seedWhere((c) => c === 2)],
  ] as const) {
    it(title, () => {
      location.hash = `#/subnetten?seed=${seed}&niveau=1`
      document.body.innerHTML = '<main id="app"></main>'
      const page = document.querySelector<HTMLElement>('#app')!
      subnetPage(page)
      page.querySelector<HTMLButtonElement>('[data-action="solution"]')!.click()
      const cards = [...page.querySelectorAll('.subnet-card legend')].map((l) => l.textContent)
      const binaryRows = [...page.querySelectorAll('.at-label')].map((l) => l.textContent).filter((t) => t!.startsWith('Subnet'))
      expect(binaryRows).toEqual(cards)
    })
  }
})
