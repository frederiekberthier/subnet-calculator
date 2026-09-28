import type { Page } from '../router'

const exercises = [
  {
    href: '#/omrekenen',
    title: 'Omrekenen',
    text: 'Zet een IPv4-adres en subnetmasker om van decimaal naar binair en omgekeerd.',
  },
  {
    href: '#/analyse',
    title: 'Adresanalyse',
    text: 'Bepaal netwerkadres, eerste en laatste host, broadcast, klasse en publiek/privaat.',
  },
  {
    href: '#/subnetten',
    title: 'Subnetten',
    text: 'Splits een netwerk in een gevraagd aantal kleinere subnetten.',
  },
]

export const homePage: Page = (root) => {
  root.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Graduaat Internet of Things</p>
      <h1>Subnetting oefenen</h1>
      <p class="lead">Onbeperkt oefenen op IPv4-adressen en subnetten, met meteen feedback en een uitgewerkte oplossing.</p>
    </section>
    <div class="cards">
      ${exercises
        .map(
          (e, i) => `
        <a class="card" href="${e.href}">
          <span class="card-nr" aria-hidden="true">${i + 1}</span>
          <h2>${e.title}</h2>
          <p>${e.text}</p>
          <span class="card-cta">Start oefening <span aria-hidden="true">›››</span></span>
        </a>`,
        )
        .join('')}
    </div>`
}

export const notFoundPage: Page = (root) => {
  root.innerHTML = `<h1>Pagina niet gevonden</h1><p><a href="#/">Terug naar de startpagina</a></p>`
}
