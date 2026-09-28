export type Page = (root: HTMLElement) => void

// Eenvoudige hash-router: werkt zonder serverconfiguratie op GitHub Pages.
export function startRouter(root: HTMLElement, routes: Record<string, Page>, notFound: Page): void {
  const render = () => {
    const path = location.hash.replace(/^#/, '').split('?')[0] || '/'
    root.replaceChildren()
    ;(routes[path] ?? notFound)(root)
    document.querySelectorAll<HTMLAnchorElement>('.site-header nav a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#${path}`)
    })
  }
  window.addEventListener('hashchange', render)
  render()
}

/** Queryparameter uit de hash, bv. seed uit "#/analyse?seed=123". */
export function getHashParam(name: string): string | null {
  const query = location.hash.split('?')[1] ?? ''
  return new URLSearchParams(query).get(name)
}
