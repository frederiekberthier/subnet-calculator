import { t } from '../i18n'
import type { Page } from '../router'

export const homePage: Page = (root) => {
  const m = t()
  const exercises = [
    { href: '#/omrekenen', title: m.nav.convert, text: m.home.cards.convert },
    { href: '#/analyse', title: m.nav.analysis, text: m.home.cards.analysis },
    { href: '#/subnetten', title: m.nav.subnetting, text: m.home.cards.subnetting },
  ]
  root.innerHTML = `
    <section class="hero">
      <p class="eyebrow">${m.home.eyebrow}</p>
      <h1>${m.site.title}</h1>
      <p class="lead">${m.home.lead}</p>
    </section>
    <div class="cards">
      ${exercises
        .map(
          (e, i) => `
        <a class="card" href="${e.href}">
          <span class="card-nr" aria-hidden="true">${i + 1}</span>
          <h2>${e.title}</h2>
          <p>${e.text}</p>
          <span class="card-cta">${m.home.start} <span aria-hidden="true">›››</span></span>
        </a>`,
        )
        .join('')}
    </div>`
}

export const notFoundPage: Page = (root) => {
  root.innerHTML = `<h1>${t().notFound.title}</h1><p><a href="#/">${t().notFound.back}</a></p>`
}
