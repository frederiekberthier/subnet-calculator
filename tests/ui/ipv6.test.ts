// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { ipv6Page } from '../../src/exercises/ipv6'
import { setLang } from '../../src/i18n'
import { generateIpv6, type Level } from '../../src/lib/generators'
import { formatFull, shortest, validShortenings } from '../../src/lib/ipv6'
import { createRng } from '../../src/lib/random'

let root: HTMLElement

function render(seed: number, level: Level = 2) {
  location.hash = `#/ipv6?seed=${seed}&niveau=${level}`
  document.body.innerHTML = '<main id="app"></main>'
  root = document.querySelector('#app')!
  ipv6Page(root)
  return generateIpv6(createRng(seed), level)
}

const check = (answer: string) => {
  root.querySelector<HTMLInputElement>('#ipv6')!.value = answer
  root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }))
  return root.querySelector('.feedback-area')!.textContent!.replace(/\s+/g, ' ')
}

beforeEach(() => {
  sessionStorage.clear()
  setLang('nl')
})

describe('oefening 4: IPv6 verkorten', () => {
  it('toont het volledige adres als opgave', () => {
    const ex = render(7)
    expect(root.querySelector('.ipv6-given')!.textContent).toBe(formatFull(ex.groups, ex.upper))
  })

  it('de kortste schrijfwijze is juist, ook in hoofdletters', () => {
    const ex = render(7)
    expect(check(shortest(ex.groups))).toContain('Alles juist')
    expect(check(shortest(ex.groups).toUpperCase())).toContain('Alles juist')
  })

  it('elke reeks nullen mag (niveau 2 heeft er twee)', () => {
    const ex = render(8, 2)
    const all = validShortenings(ex.groups)
    expect(all.length).toBe(2)
    for (const answer of all) expect(check(answer), answer).toContain('Alles juist')
  })

  it('voorloopnul laten staan: fout met de juiste tip', () => {
    render(1, 1) // 2001:0db8:...
    const text = check('2001:0db8::1')
    expect(text).toContain('0 van 1 velden juist')
  })

  it('voorloopnul laten staan bij het juiste adres: tip over voorloopnullen', () => {
    const ex = render(1, 1)
    const answer = shortest(ex.groups).replace('db8', '0db8')
    expect(check(answer)).toContain('voorloopnullen weg')
  })

  it(':: twee keer: tip', () => {
    render(1, 1)
    expect(check('2001::1::1')).toContain('maar één keer')
  })

  it('de oplossing toont de 8 blokken, de stappen en het antwoord van de student (ge-escaped)', () => {
    const ex = render(8, 2)
    check('<b>x</b>')
    root.querySelector<HTMLElement>('[data-action="solution"]')!.click()
    const solution = root.querySelector('.solution')!
    expect(solution.querySelectorAll('.v6-group')).toHaveLength(8)
    expect(solution.querySelectorAll('.v6-run').length).toBeGreaterThan(0)
    expect(solution.textContent).toContain(shortest(ex.groups))
    expect(solution.textContent).toContain('Ook juist')
    expect(solution.innerHTML).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})
