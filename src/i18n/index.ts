// Taalkeuze (Nederlands / Engels).
// Volgorde: ?lang= in de link (deelbaar, bv. .../subnetting/?lang=en) > eerder gekozen taal > Nederlands.
import { en } from './en'
import { nl, type Messages } from './nl'

export type Lang = 'nl' | 'en'
export const LANGS: readonly Lang[] = ['nl', 'en']

const DICTIONARIES: Record<Lang, Messages> = { nl, en }
const STORAGE_KEY = 'subnetting.lang'

let current: Lang = 'nl'

const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang)

function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // privévenster of opslag geblokkeerd
  }
}

/** De teksten in de huidige taal. */
export function t(): Messages {
  return DICTIONARIES[current]
}

export function getLang(): Lang {
  return current
}

/** Bepaal de taal bij het laden van de pagina. */
export function initLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang')
  const fromStorage = stored()
  current = isLang(fromUrl) ? fromUrl : isLang(fromStorage) ? fromStorage : 'nl'
  applyStaticTexts()
  return current
}

/** Schakel naar een andere taal: onthouden, in de link zetten en de vaste teksten vertalen. */
export function setLang(lang: Lang): void {
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // enkel een gemak
  }
  // ?lang= in de URL (vóór de #), zodat een gedeelde link in dezelfde taal opent.
  const url = new URL(location.href)
  url.searchParams.set('lang', lang)
  history.replaceState(history.state, '', url)
  applyStaticTexts()
}

/** Waarde in het woordenboek op basis van een pad zoals "nav.convert". */
function lookup(path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], t())
  return typeof value === 'string' ? value : undefined
}

/**
 * Vertaal de vaste delen van index.html (header, footer, metagegevens):
 * - data-i18n="pad" → tekst
 * - data-i18n-attr="attribuut:pad;attribuut:pad" → attributen (bv. aria-label, href)
 */
export function applyStaticTexts(doc: Document = document): void {
  doc.documentElement.lang = current
  doc.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const text = lookup(el.dataset.i18n!)
    if (text !== undefined) el.textContent = text
  })
  doc.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr!.split(';')) {
      const [attr, path] = pair.split(':')
      const text = lookup(path)
      if (text !== undefined) el.setAttribute(attr, text)
    }
  })
  doc.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lang === current))
  })
}
