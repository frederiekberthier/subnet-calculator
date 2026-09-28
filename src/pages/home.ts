import type { Page } from '../router'

const exercises = [
  {
    href: '#/binair',
    title: '1. Binair ↔ decimaal',
    text: 'Zet een IPv4-adres en subnetmasker om van decimaal naar binair en omgekeerd.',
  },
  {
    href: '#/analyse',
    title: '2. Adresanalyse',
    text: 'Bepaal netwerkadres, eerste en laatste host, broadcast, klasse en publiek/privaat.',
  },
  {
    href: '#/subnetten',
    title: '3. Subnetten',
    text: 'Splits een netwerk in een gevraagd aantal kleinere subnetten.',
  },
]

export const homePage: Page = (root) => {
  root.innerHTML = `
    <h1>Subnetting oefenen</h1>
    <p class="lead">Kies een oefening. Je krijgt telkens een nieuwe opgave en meteen feedback.</p>
    <div class="cards">
      ${exercises
        .map(
          (e) => `
        <a class="card" href="${e.href}">
          <h2>${e.title}</h2>
          <p>${e.text}</p>
        </a>`,
        )
        .join('')}
    </div>`
}

export const notFoundPage: Page = (root) => {
  root.innerHTML = `<h1>Pagina niet gevonden</h1><p><a href="#/">Terug naar de startpagina</a></p>`
}
