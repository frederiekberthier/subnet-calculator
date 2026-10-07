import { t } from './i18n'

export type Page = (root: HTMLElement) => void

export interface Router {
  /** Pagina opnieuw tonen (bv. na een taalwissel) met behoud van ingevulde antwoorden, feedback en oplossing. */
  rerender: () => void
}

function currentPath(): string {
  return location.hash.replace(/^#/, '').split('?')[0] || '/'
}

/** Sleutel per invoerveld, zodat waarden na het opnieuw tonen van de pagina teruggezet kunnen worden. */
function fieldKey(input: HTMLInputElement): string {
  if (input.type === 'radio') return `radio:${input.name}:${input.value}`
  if (input.dataset.field) return `octet:${input.dataset.field}:${input.dataset.index}`
  return `id:${input.id}`
}

// Eenvoudige hash-router: werkt zonder serverconfiguratie, ook in een submap op de FTP-server.
export function startRouter(root: HTMLElement, routes: Record<string, Page>, notFound: Page): Router {
  const render = () => {
    const path = currentPath()
    root.replaceChildren()
    // Object.hasOwn: anders worden namen als #hasOwnProperty of #constructor als route gezien (issue #13).
    ;(Object.hasOwn(routes, path) ? routes[path] : notFound)(root)
    document.querySelectorAll<HTMLAnchorElement>('.site-header nav a').forEach((a) => {
      const active = a.getAttribute('href') === `#${path}`
      a.classList.toggle('active', active)
      if (active) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    })
    // Paginatitel volgt de kop, bv. "Omrekenen – Subnetting oefenen" (issue #15).
    const site = t().site.title
    const h1 = root.querySelector('h1')?.textContent?.replace(/^\d+\.\s*/, '') ?? ''
    document.title = h1 && h1 !== site ? `${h1} – ${site}` : site
  }
  const navigate = () => {
    render()
    // Bij een paginawissel de focus naar de titel, tenzij de pagina zelf al een invoervak koos.
    if (!root.contains(document.activeElement)) {
      const h1 = root.querySelector<HTMLElement>('h1')
      if (h1) {
        h1.tabIndex = -1
        h1.focus({ preventScroll: true })
      }
      window.scrollTo(0, 0)
    }
  }
  window.addEventListener('hashchange', navigate)
  // "Naar inhoud": niet via de hash (die is voor de router), maar rechtstreeks focus op de inhoud.
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault()
    root.focus()
  })
  // Een klik op het menu-item van de huidige pagina mag de opgave (en de antwoorden) niet wissen (issue #5).
  document.querySelector('.site-header nav')?.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a')
    if (link && link.getAttribute('href') === `#${currentPath()}`) e.preventDefault()
  })
  render()

  return {
    rerender: () => {
      // Dezelfde opgave (seed staat in de URL); antwoorden, feedback en oplossing blijven behouden.
      const values = new Map(
        [...root.querySelectorAll<HTMLInputElement>('input')].map((el) => [fieldKey(el), el.type === 'radio' ? el.checked : el.value]),
      )
      const hadFeedback = (root.querySelector('.feedback-area')?.innerHTML.trim() ?? '') !== ''
      const hadSolution = root.querySelector<HTMLElement>('.solution')?.hidden === false
      const scroll = window.scrollY
      render()
      root.querySelectorAll<HTMLInputElement>('input').forEach((el) => {
        const value = values.get(fieldKey(el))
        if (typeof value === 'boolean') el.checked = value
        else if (typeof value === 'string') el.value = value
      })
      if (hadFeedback) root.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }))
      if (hadSolution) root.querySelector<HTMLElement>('[data-action="solution"]')?.click()
      window.scrollTo(0, scroll)
    },
  }
}
