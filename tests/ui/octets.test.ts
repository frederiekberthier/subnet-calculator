// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { octetInputsHtml, octetValues, wireOctetInputs } from '../../src/ui/octets'

let form: HTMLFormElement

function setup(kind: 'dec' | 'bin' = 'dec') {
  document.body.innerHTML = `<form>${octetInputsHtml('a', kind, 'Adres A')}${octetInputsHtml('b', kind, 'Adres B')}<input id="prefix"></form>`
  form = document.querySelector('form')!
  wireOctetInputs(form)
}

const box = (field: string, i: number) => form.querySelector<HTMLInputElement>(`input[data-field="${field}"][data-index="${i}"]`)!

/** Typen zoals een gsm het doet: de waarde verandert en er komt enkel een input-event. */
function typeValue(el: HTMLInputElement, value: string) {
  el.focus()
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function paste(el: HTMLInputElement, text: string) {
  el.focus()
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })
  el.dispatchEvent(event)
}

describe('invoervakjes (issues #4 en #11)', () => {
  beforeEach(() => setup())

  it('decimale vakjes tonen een klavier met punt (inputmode=decimal)', () => {
    expect(box('a', 0).getAttribute('inputmode')).toBe('decimal')
  })

  it('springt door na 3 cijfers of een waarde boven 25', () => {
    typeValue(box('a', 0), '192')
    expect(document.activeElement).toBe(box('a', 1))
    typeValue(box('a', 1), '26')
    expect(document.activeElement).toBe(box('a', 2))
  })

  it('punt, komma of spatie via het input-event springt door (gsm) en wordt weggefilterd', () => {
    typeValue(box('a', 0), '10.')
    expect(box('a', 0).value).toBe('10')
    expect(document.activeElement).toBe(box('a', 1))
    typeValue(box('a', 1), '0,')
    expect(document.activeElement).toBe(box('a', 2))
    typeValue(box('a', 2), '5 ')
    expect(document.activeElement).toBe(box('a', 3))
  })

  it('een punt in een leeg vakje springt niet door', () => {
    typeValue(box('a', 0), '.')
    expect(box('a', 0).value).toBe('')
    expect(document.activeElement).toBe(box('a', 0))
  })

  it('na de laatste byte gaat de focus naar het volgende veld (ook een ander adres of de prefix)', () => {
    typeValue(box('a', 3), '255')
    expect(document.activeElement).toBe(box('b', 0))
    typeValue(box('b', 3), '255')
    expect(document.activeElement).toBe(form.querySelector('#prefix'))
  })

  it('plakken van een volledig adres vult de vier vakjes van dat adres', () => {
    paste(box('a', 0), '172.29.160.1')
    expect(octetValues(form, 'a')).toEqual(['172', '29', '160', '1'])
    expect(octetValues(form, 'b')).toEqual(['', '', '', ''])
    expect(document.activeElement).toBe(box('b', 0))
  })

  it('plakken vanaf een later vakje vult enkel de resterende vakjes', () => {
    paste(box('a', 2), '175.254')
    expect(octetValues(form, 'a')).toEqual(['', '', '175', '254'])
  })

  it('plakken van HTML of tekst doet niets', () => {
    paste(box('a', 0), '<img src=x onerror=alert(1)>')
    expect(octetValues(form, 'a')).toEqual(['', '', '', ''])
  })

  it('binair: 32 bits plakken verdeelt ze per 8', () => {
    setup('bin')
    paste(box('a', 0), '11000000101010000000000100001010')
    expect(octetValues(form, 'a')).toEqual(['11000000', '10101000', '00000001', '00001010'])
  })

  it('binair: enkel 0 en 1, doorspringen na 8 bits', () => {
    setup('bin')
    typeValue(box('a', 0), '1102a00000')
    expect(box('a', 0).value).toBe('11000000')
    expect(document.activeElement).toBe(box('a', 1))
  })
})
