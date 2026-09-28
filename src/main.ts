import './style.css'
import { startRouter } from './router'
import { homePage, notFoundPage } from './pages/home'
import { binaryPage } from './exercises/binary'
import { analyzePage } from './exercises/analyze'
import { subnetPage } from './exercises/subnet'

startRouter(
  document.querySelector<HTMLElement>('#app')!,
  {
    '/': homePage,
    '/binair': binaryPage,
    '/analyse': analyzePage,
    '/subnetten': subnetPage,
  },
  notFoundPage,
)
