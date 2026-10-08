import './fonts.css'
import './style.css'
import { initLang, setLang, type Lang } from './i18n'
import { startRouter } from './router'
import { homePage, notFoundPage } from './pages/home'
import { binaryPage } from './exercises/binary'
import { analyzePage } from './exercises/analyze'
import { subnetPage } from './exercises/subnet'

document.querySelector('#year')!.textContent = String(new Date().getFullYear())

// Taal eerst bepalen: de pagina's halen hun teksten uit het woordenboek van die taal.
initLang()

const router = startRouter(
  document.querySelector<HTMLElement>('#app')!,
  {
    '/': homePage,
    '/omrekenen': binaryPage,
    '/analyse': analyzePage,
    '/subnetten': subnetPage,
  },
  notFoundPage,
)

// Taalknoppen NL / EN in de header.
document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => {
    setLang(button.dataset.lang as Lang)
    router.rerender()
  })
})
