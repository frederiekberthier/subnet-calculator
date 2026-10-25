// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { choiceHtml } from '../../src/ui/choice'
import { wireFormNavigation } from '../../src/ui/navigation'
import { octetInputsHtml, wireOctetInputs } from '../../src/ui/octets'

let form: HTMLFormElement
let submitted: ReturnType<typeof vi.fn<(e: Event) => void>>

/** Formulier zoals bij adresanalyse: prefix, adres, aantal hosts, twee keuzegroepen en Controleer. */
beforeEach(() => {
  document.body.innerHTML = `
    <form>
      <input id="prefix" data-max="32">
      ${octetInputsHtml('net', 'dec', 'Netwerkadres')}
      <input id="hosts">
      ${choiceHtml('class', 'Klasse', [['A', 'A'], ['B', 'B'], ['C', 'C']])}
      ${choiceHtml('scope', 'Publiek of privaat', [['public', 'Publiek'], ['private', 'Privaat']])}
      <button type="submit">Controleer</button>
    </form>`
  form = document.querySelector('form')!
  submitted = vi.fn<(e: Event) => void>((e) => e.preventDefault())
  form.addEventListener('submit', submitted)
  wireOctetInputs(form)
  wireFormNavigation(form)
})

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!
const net = (i: number) => $<HTMLInputElement>(`input[data-field="net"][data-index="${i}"]`)
const type = (el: HTMLInputElement, value: string) => {
  el.focus()
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}
const enter = (el: HTMLElement) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

describe('prefix springt door zonder het antwoord te kennen', () => {
  it('2 cijfers of 4-9: door naar het volgende veld', () => {
    type($('#prefix'), '24')
    expect(document.activeElement).toBe(net(0))
    type($('#prefix'), '8')
    expect(document.activeElement).toBe(net(0))
  })

  it('1, 2 of 3: wachten (kan nog 1x, 2x of 30-32 worden)', () => {
    type($('#prefix'), '2')
    expect(document.activeElement).toBe($('#prefix'))
  })
})

describe('Enter', () => {
  it('gaat naar het volgende veld zolang niet alles ingevuld is', () => {
    $('#prefix').focus()
    enter($('#prefix'))
    expect(document.activeElement).toBe(net(0))
    expect(submitted).not.toHaveBeenCalled()
  })

  it('in het aantal hosts (geen vaste lengte) gaat Enter naar de keuzeknoppen', () => {
    type($('#hosts'), '4094')
    enter($('#hosts'))
    expect(document.activeElement).toBe($('input[name="class"][value="A"]'))
  })

  it('controleert als alles ingevuld is', () => {
    type($('#prefix'), '20')
    ;['172', '29', '160', '0'].forEach((v, i) => (net(i).value = v))
    $<HTMLInputElement>('#hosts').value = '4094'
    $<HTMLInputElement>('input[name="class"][value="B"]').checked = true
    $<HTMLInputElement>('input[name="scope"][value="private"]').checked = true
    enter($('#hosts'))
    expect(submitted).toHaveBeenCalledTimes(1)
  })

  it('op een keuzeknop gaat Enter naar het volgende veld', () => {
    const b = $<HTMLInputElement>('input[name="class"][value="B"]')
    b.focus()
    enter(b)
    expect(document.activeElement).toBe($('input[name="scope"][value="public"]'))
  })

  it('gsm-klavier toont "Volgende", het laatste veld vóór Controleer "Klaar"', () => {
    expect($<HTMLInputElement>('#prefix').enterKeyHint).toBe('next')
    expect($<HTMLInputElement>('#hosts').enterKeyHint).toBe('next')
  })
})

describe('keuzeknoppen', () => {
  const pick = (input: HTMLInputElement, withPointer: boolean) => {
    if (withPointer) input.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  it('na een klik: focus naar de volgende groep, na de laatste groep naar Controleer', () => {
    pick($('input[name="class"][value="C"]'), true)
    expect(document.activeElement).toBe($('input[name="scope"][value="public"]'))
    pick($('input[name="scope"][value="private"]'), true)
    expect(document.activeElement).toBe($('button[type="submit"]'))
  })

  it('met de pijltjestoetsen blijft de focus in de groep (verder kiezen moet kunnen)', () => {
    const a = $<HTMLInputElement>('input[name="class"][value="A"]')
    a.focus()
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    const b = $<HTMLInputElement>('input[name="class"][value="B"]')
    b.focus()
    pick(b, false)
    expect(document.activeElement).toBe(b)
  })
})
