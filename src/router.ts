export type Page = (root: HTMLElement) => void

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
      a.classList.toggle('active', a.getAttribute('href') === `#${path}`)
    })
  }
  window.addEventListener('hashchange', render)
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
