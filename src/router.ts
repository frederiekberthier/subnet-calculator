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
