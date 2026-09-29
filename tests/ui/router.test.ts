// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest'
import { startRouter, type Page } from '../../src/router'

const page =
  (title: string): Page =>
  (root) => {
    root.innerHTML = `<h1>${title}</h1>`
  }

let root: HTMLElement

beforeAll(() => {
  document.body.innerHTML = `
    <header class="site-header">
      <a class="skip-link" href="#app">Naar inhoud</a>
      <nav><a href="#/omrekenen">Omrekenen</a><a href="#/analyse">Adresanalyse</a></nav>
    </header>
    <main id="app" tabindex="-1"></main>`
  root = document.querySelector('#app')!
  location.hash = '#/'
  startRouter(
    root,
    { '/': page('Subnetting oefenen'), '/omrekenen': page('1. Omrekenen'), '/analyse': page('2. Adresanalyse') },
    page('Pagina niet gevonden'),
  )
})

async function go(hash: string) {
  location.hash = hash
  await new Promise((r) => setTimeout(r, 0)) // hashchange is asynchroon
}

describe('router', () => {
  it('toont de juiste pagina en paginatitel (issue #15)', async () => {
    await go('#/omrekenen?seed=1')
    expect(root.querySelector('h1')!.textContent).toBe('1. Omrekenen')
    expect(document.title).toBe('Omrekenen – Subnetting oefenen')
  })

  it('actieve menulink krijgt aria-current (issue #15)', async () => {
    await go('#/analyse')
    const current = document.querySelectorAll('nav a[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0].textContent).toBe('Adresanalyse')
  })

  it('focus op de titel na navigeren (issue #15)', async () => {
    await go('#/omrekenen')
    expect(document.activeElement).toBe(root.querySelector('h1'))
  })

  it('onbekende routes en namen van Object.prototype geven "niet gevonden" (issue #13)', async () => {
    for (const hash of ['#/bestaatniet', '#hasOwnProperty', '#constructor', '#/toString']) {
      await go(hash)
      expect(root.querySelector('h1')!.textContent, hash).toBe('Pagina niet gevonden')
    }
  })

  it('klik op de menulink van de huidige pagina navigeert niet (issue #5)', async () => {
    await go('#/analyse?seed=5')
    const link = document.querySelector<HTMLAnchorElement>('nav a[href="#/analyse"]')!
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    const other = new MouseEvent('click', { bubbles: true, cancelable: true })
    document.querySelector('nav a[href="#/omrekenen"]')!.dispatchEvent(other)
    expect(other.defaultPrevented).toBe(false)
  })

  it('"Naar inhoud" zet de focus op de inhoud zonder de hash te wijzigen', async () => {
    await go('#/analyse?seed=7')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    document.querySelector('.skip-link')!.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(root)
    expect(location.hash).toBe('#/analyse?seed=7')
  })
})
