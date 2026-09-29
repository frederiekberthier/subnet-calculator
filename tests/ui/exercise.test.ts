// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import type { FieldResult } from '../../src/lib/check'
import { GENERATOR_VERSION } from '../../src/lib/generators'
import { clearMarks, formatCount, markField, readState, showFeedback } from '../../src/ui/exercise'
import { overviewHtml } from '../../src/ui/overview'

const query = () => new URLSearchParams(location.hash.split('?')[1])

describe('readState: instellingen in de URL (issues #5 en #22)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    location.hash = ''
  })

  it('zonder parameters: seed, niveau 1 en generatorversie worden in de URL gezet', () => {
    location.hash = '#/analyse'
    const state = readState('/analyse')
    expect(state.level).toBe(1)
    expect(query().get('seed')).toBe(String(state.seed))
    expect(query().get('niveau')).toBe('1')
    expect(query().get('v')).toBe(String(GENERATOR_VERSION))
    expect(state.outdated).toBe(false)
  })

  it('ongeldige waarden worden vervangen', () => {
    location.hash = '#/analyse?seed=abc&niveau=9'
    const state = readState('/analyse')
    expect(state.level).toBe(1)
    expect(Number.isInteger(state.seed)).toBe(true)
    expect(query().get('niveau')).toBe('1')
  })

  it('dezelfde seed geeft dezelfde random-reeks', () => {
    location.hash = '#/analyse?seed=42&niveau=2'
    const a = readState('/analyse').rng.next()
    location.hash = '#/analyse?seed=42&niveau=2'
    expect(readState('/analyse').rng.next()).toBe(a)
  })

  it('gekozen niveau wordt onthouden voor een link zonder niveau', () => {
    location.hash = '#/analyse?seed=1&niveau=3'
    readState('/analyse')
    location.hash = '#/subnetten'
    expect(readState('/subnetten').level).toBe(3)
  })

  it('een niveau in de link wint van het onthouden niveau', () => {
    location.hash = '#/analyse?niveau=3'
    readState('/analyse')
    location.hash = '#/subnetten?niveau=2'
    expect(readState('/subnetten').level).toBe(2)
  })

  it('richting wordt enkel onthouden waar ze gevraagd wordt', () => {
    location.hash = '#/omrekenen?richting=bin2dec'
    readState('/omrekenen', ['niveau', 'richting'])
    location.hash = '#/omrekenen'
    readState('/omrekenen', ['niveau', 'richting'])
    expect(query().get('richting')).toBe('bin2dec')
    location.hash = '#/analyse'
    readState('/analyse')
    expect(query().get('richting')).toBeNull()
  })

  it('link van een oudere generatorversie wordt gemarkeerd', () => {
    location.hash = `#/analyse?seed=1&v=${GENERATOR_VERSION - 1}`
    expect(readState('/analyse').outdated).toBe(true)
    expect(query().get('v')).toBe(String(GENERATOR_VERSION))
  })
})

describe('feedback per veld (issues #8 en #14)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<form><input id="a"><input id="b"><input id="c"></form><div id="area"></div>'
  })

  it('markField zet klasse en aria-invalid; clearMarks ruimt alles op', () => {
    const a = document.querySelector<HTMLInputElement>('#a')!
    expect(markField(a, { status: 'wrong' })).toBe(false)
    expect(a.classList.contains('is-wrong')).toBe(true)
    expect(a.getAttribute('aria-invalid')).toBe('true')
    clearMarks(document.body)
    expect(a.className).toBe('')
    expect(a.hasAttribute('aria-invalid')).toBe(false)
  })

  it('showFeedback koppelt formaattips via aria-describedby aan de velden', () => {
    const form = document.querySelector('form')!
    const hint = 'Een byte is een getal van 0 tot 255.'
    const results: FieldResult[] = [{ status: 'ok' }, { status: 'format', hint }, { status: 'empty' }]
    ;['#a', '#b', '#c'].forEach((id, i) => markField(document.querySelector(id)!, results[i]))
    showFeedback(document.querySelector('#area')!, form, results)
    const b = document.querySelector('#b')!
    const describedBy = b.getAttribute('aria-describedby')!
    expect(document.getElementById(describedBy)!.textContent).toBe(hint)
    expect(document.querySelector('#a')!.hasAttribute('aria-describedby')).toBe(false)
    expect(document.querySelector('#area')!.textContent).toContain('1 van 3 velden juist')
    expect(document.querySelector('#c')!.classList.contains('is-empty')).toBe(true)
  })
})

describe('overzicht in de oplossing', () => {
  it('antwoorden van studenten worden ge-escaped (issue #21)', () => {
    const html = overviewHtml([{ label: 'Netwerkadres', correct: '10.0.0.0', given: '<b>x</b>', result: { status: 'wrong' } }])
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('<b>x</b>')
  })

  it('formatCount gebruikt een smalle spatie, geen punt', () => {
    expect(formatCount(131070)).toBe('131 070')
    expect(formatCount(62)).toBe('62')
  })
})
