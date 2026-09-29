export type Page = (root: HTMLElement) => void

const SITE_TITLE = 'Subnetting oefenen'

function currentPath(): string {
  return location.hash.replace(/^#/, '').split('?')[0] || '/'
}

// Eenvoudige hash-router: werkt zonder serverconfiguratie op GitHub Pages.
export function startRouter(root: HTMLElement, routes: Record<string, Page>, notFound: Page): void {
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
    const h1 = root.querySelector('h1')?.textContent?.replace(/^\d+\.\s*/, '') ?? ''
    document.title = h1 && h1 !== SITE_TITLE ? `${h1} – ${SITE_TITLE}` : SITE_TITLE
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
}

/** Queryparameter uit de hash, bv. seed uit "#/analyse?seed=123". */
export function getHashParam(name: string): string | null {
  const query = location.hash.split('?')[1] ?? ''
  return new URLSearchParams(query).get(name)
}
