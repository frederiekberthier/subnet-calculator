// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { analyzePage } from '../../src/exercises/analyze'
import { binaryPage } from '../../src/exercises/binary'
import { subnetPage } from '../../src/exercises/subnet'
import { applyStaticTexts, getLang, initLang, setLang } from '../../src/i18n'
import { en } from '../../src/i18n/en'
import { nl } from '../../src/i18n/nl'
import { homePage, notFoundPage } from '../../src/pages/home'
import type { Page } from '../../src/router'

/**
 * Typisch Nederlandse woorden die in de Engelse versie nooit mogen voorkomen.
 * (Woorden die in beide talen gelijk zijn, zoals Subnet, Prefix of Expert, staan er bewust niet in.)
 */
const DUTCH =
  /\b(de|het|een|en|van|niet|juist|jij|fout|bruikbare?|netwerkadres|subnetmasker|oplossing|controleer|klasse|publiek|privaat|stappen|overzicht|geleende|nieuwe?|oefening|oefenen|richting|niveau|gevorderd|basis|willekeurig|binair|decimaal|minstens|netwerken|gevraagd|uitschrijven|berekening|blokgrootte|enen|velden|ingevuld|eerste|laatste|toon|alle|opleiding|hogeschool)\b/i

function render(page: Page, hash: string): HTMLElement {
  location.hash = hash
  document.body.innerHTML = '<main id="app"></main>'
  const root = document.querySelector<HTMLElement>('#app')!
  page(root)
  return root
}

/** Pagina met feedback (Controleer) en oplossing zichtbaar, zodat ook die teksten getest worden. */
function renderAll(page: Page, hash: string): HTMLElement {
  const root = render(page, hash)
  const form = root.querySelector('form')
  if (form) {
    // één vakje met een formaatfout, zodat ook een tip verschijnt
    const box = root.querySelector<HTMLInputElement>('input.octet')
    if (box) box.value = '999'
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    root.querySelector<HTMLElement>('[data-action="solution"]')!.click()
    root.querySelector('details')?.setAttribute('open', '')
  }
  return root
}

const PAGES: Array<[string, Page, string]> = [
  ['startpagina', homePage, '#/'],
  ['niet gevonden', notFoundPage, '#/bestaatniet'],
  ['omrekenen dec→bin', binaryPage, '#/omrekenen?seed=3&niveau=2&richting=dec2bin'],
  ['omrekenen bin→dec', binaryPage, '#/omrekenen?seed=3&niveau=2&richting=bin2dec'],
  ['adresanalyse', analyzePage, '#/analyse?seed=3&niveau=3'],
  ['subnetten', subnetPage, '#/subnetten?seed=3&niveau=3'],
]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  history.replaceState(null, '', '/')
})

afterEach(() => setLang('nl'))

describe('Engelse versie: geen Nederlandse tekst meer', () => {
  for (const [name, page, hash] of PAGES) {
    it(name, () => {
      setLang('en')
      const text = renderAll(page, hash).textContent!.replace(/\s+/g, ' ')
      expect(text.match(DUTCH)?.[0], text.slice(0, 300)).toBeUndefined()
    })
  }

  it('ook de attributen (aria-label, title) zijn vertaald', () => {
    setLang('en')
    for (const [, page, hash] of PAGES) {
      const root = renderAll(page, hash)
      const attrs = [...root.querySelectorAll('[aria-label], [title]')].flatMap((el) => [el.getAttribute('aria-label') ?? '', el.getAttribute('title') ?? ''])
      for (const value of attrs) expect(value.match(DUTCH)?.[0], value).toBeUndefined()
    }
  })

  it('de Nederlandse versie blijft Nederlands', () => {
    setLang('nl')
    const text = renderAll(analyzePage, '#/analyse?seed=3&niveau=3').textContent!
    expect(text).toContain('Netwerkadres')
    expect(text).toContain('Oplossing')
  })

  it('header en footer uit index.html worden vertaald', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
    document.body.innerHTML = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script'))
    const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
    document.head.innerHTML = head
    setLang('en')
    applyStaticTexts()
    // De taalknoppen (NL / EN) niet meetellen: "EN" is geen Nederlands woord maar de knop zelf.
    const clone = document.body.cloneNode(true) as HTMLElement
    clone.querySelector('.lang-switch')?.remove()
    const text = clone.textContent!.replace(/\s+/g, ' ')
    expect(text.match(DUTCH)?.[0], text).toBeUndefined()
    expect(text).toContain('Skip to content')
    expect(text).toContain('More about the programme')
    expect(document.querySelector('.footer-more')!.getAttribute('href')).toBe(en.footer.moreUrl)
    expect(document.querySelector('meta[name="description"]')!.getAttribute('content')).toBe(en.site.description)
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('[data-lang="en"]')!.getAttribute('aria-pressed')).toBe('true')
    setLang('nl')
    applyStaticTexts()
    expect(document.body.textContent).toContain('Meer info over de opleiding')
    expect(document.querySelector('[data-lang="nl"]')!.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('taalkeuze', () => {
  it('standaard Nederlands', () => {
    expect(initLang()).toBe('nl')
  })

  it('?lang=en in de link wint van de opgeslagen keuze', () => {
    localStorage.setItem('subnetting.lang', 'nl')
    history.replaceState(null, '', '/?lang=en#/analyse')
    expect(initLang()).toBe('en')
  })

  it('zonder link: de eerder gekozen taal', () => {
    localStorage.setItem('subnetting.lang', 'en')
    expect(initLang()).toBe('en')
  })

  it('ongeldige waarden worden genegeerd', () => {
    localStorage.setItem('subnetting.lang', 'fr')
    history.replaceState(null, '', '/?lang=xx')
    expect(initLang()).toBe('nl')
  })

  it('setLang onthoudt de taal en zet ze in de link, met behoud van de opgave in de hash', () => {
    history.replaceState(null, '', '/#/subnetten?seed=5')
    setLang('en')
    expect(getLang()).toBe('en')
    expect(localStorage.getItem('subnetting.lang')).toBe('en')
    expect(new URLSearchParams(location.search).get('lang')).toBe('en')
    expect(location.hash).toBe('#/subnetten?seed=5')
  })

  it('beide woordenboeken hebben dezelfde teksten (geen lege vertalingen)', () => {
    const keys = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]))
    expect(keys(en).sort()).toEqual(keys(nl).sort())
    const empty = (obj: object): boolean => Object.values(obj).some((v) => v === '' || (v && typeof v === 'object' && empty(v)))
    expect(empty(en)).toBe(false)
  })
})
