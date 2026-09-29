import './fonts.css'
import './style.css'
import { startRouter } from './router'
import { homePage, notFoundPage } from './pages/home'
import { binaryPage } from './exercises/binary'
import { analyzePage } from './exercises/analyze'
import { subnetPage } from './exercises/subnet'

document.querySelector('#year')!.textContent = String(new Date().getFullYear())

startRouter(
  document.querySelector<HTMLElement>('#app')!,
  {
    '/': homePage,
    '/omrekenen': binaryPage,
    '/analyse': analyzePage,
    '/subnetten': subnetPage,
  },
  notFoundPage,
)
