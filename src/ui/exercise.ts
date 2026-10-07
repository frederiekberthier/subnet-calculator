// Gedeelde bouwstenen voor de oefenpagina's: instellingen in de URL, werkbalk en veldfeedback.
import { t } from '../i18n'
import type { FieldResult } from '../lib/check'
import { GENERATOR_VERSION, LEVELS, type Level } from '../lib/generators'
import { createRng, parseSeed, randomSeed, type Rng } from '../lib/random'

export interface ExerciseState {
  path: string
  params: URLSearchParams
  seed: number
  level: Level
  rng: Rng
  /** De link werd gemaakt met een andere generatorversie: de opgave kan verschillen van wat gedeeld werd. */
  outdated: boolean
}

/** Instellingen die over de oefeningen heen onthouden worden (per browsertab) als ze niet in de link staan. */
const REMEMBERED = ['niveau', 'richting'] as const

function remembered(key: string): string | null {
  try {
    return sessionStorage.getItem(`subnetting.${key}`)
  } catch {
    return null // bv. privévenster of opslag geblokkeerd: dan gewoon de standaard
  }
}

function remember(key: string, value: string): void {
  try {
    sessionStorage.setItem(`subnetting.${key}`, value)
  } catch {
    // niet erg: enkel een gemak
  }
}

/**
 * Leest seed en instellingen uit de hash (#/pad?seed=..&niveau=..).
 * - Instellingen die niet in de link staan, komen uit wat de student eerder koos (issue #5).
 * - Seed en niveau worden altijd in de URL gezet, zodat een gedeelde link overal dezelfde opgave geeft.
 */
export function readState(path: string, settings: readonly string[] = ['niveau']): ExerciseState {
  const before = location.hash.split('?')[1] ?? ''
  const params = new URLSearchParams(before)
  for (const key of REMEMBERED.filter((k) => settings.includes(k))) {
    const value = params.get(key) ?? remembered(key)
    if (value !== null) {
      params.set(key, value)
      if (key !== 'niveau') remember(key, value)
    }
  }
  let seed = parseSeed(params.get('seed'))
  if (seed === null) {
    seed = randomSeed()
    params.set('seed', String(seed))
  }
  const version = params.get('v')
  const outdated = version !== null && version !== String(GENERATOR_VERSION)
  params.set('v', String(GENERATOR_VERSION))
  const n = Number(params.get('niveau'))
  const level: Level = LEVELS.includes(n as Level) ? (n as Level) : 1
  params.set('niveau', String(level))
  remember('niveau', String(level))
  if (params.toString() !== before) {
    // replaceState triggert geen hashchange, dus geen dubbele render.
    history.replaceState(null, '', `#${path}?${params}`)
  }
  return { path, params, seed, level, rng: createRng(seed), outdated }
}

/** Staat de focus na de volgende render op het eerste invoervak? Enkel na "Nieuwe oefening" of een instelling. */
let focusFirstInput = false

/**
 * Focus op het eerste invoervak, maar enkel na "Nieuwe oefening" of een gewijzigde instelling.
 * Bij het openen van een pagina blijft de focus bij de titel: op gsm springt anders het klavier open
 * en verdwijnt de opgave uit beeld, en een schermlezer zou titel en uitleg overslaan (issue #15).
 */
export function focusAfterNew(input: HTMLElement): void {
  if (focusFirstInput) input.focus()
  focusFirstInput = false
}

/** Naar een nieuwe opgave met (eventueel) gewijzigde instellingen. */
export function goToNew(state: ExerciseState, changes: Record<string, string> = {}): void {
  focusFirstInput = true
  const params = new URLSearchParams(state.params)
  for (const [k, v] of Object.entries(changes)) params.set(k, v)
  params.set('seed', String(randomSeed()))
  location.hash = `#${state.path}?${params}`
}

/** Melding als een gedeelde link met een oudere versie van de site gemaakt werd. */
export function outdatedNoticeHtml(state: ExerciseState): string {
  return state.outdated
    ? `<p class="notice" role="status">${t().common.outdated}</p>`
    : ''
}

export function levelSelectHtml(level: Level): string {
  return `
    <label class="control">${t().common.level}
      <select data-setting="niveau">
        ${LEVELS.map((l) => `<option value="${l}" ${l === level ? 'selected' : ''}>${t().common.levels[l]}</option>`).join('')}
      </select>
    </label>`
}

/** Koppel de werkbalk: elke select met data-setting en de knop "Nieuwe oefening". */
export function wireToolbar(root: HTMLElement, state: ExerciseState): void {
  root.querySelectorAll<HTMLSelectElement>('select[data-setting]').forEach((select) => {
    select.addEventListener('change', () => goToNew(state, { [select.dataset.setting!]: select.value }))
  })
  root.querySelector('[data-action="new"]')?.addEventListener('click', () => goToNew(state))
}

/** Toon het resultaat van een controle op een invoerveld. Geeft true terug als het juist is. */
export function markField(input: HTMLElement, result: FieldResult): boolean {
  input.classList.remove('is-ok', 'is-wrong', 'is-empty')
  input.classList.add(result.status === 'ok' ? 'is-ok' : result.status === 'empty' ? 'is-empty' : 'is-wrong')
  // De tip staat zichtbaar onder de opgave; showFeedback koppelt ze aan dit veld via aria-describedby.
  const hint = result.status === 'format' ? t().hints[result.hint] : ''
  input.title = hint
  if (hint) input.dataset.hint = hint
  input.setAttribute('aria-invalid', String(result.status !== 'ok'))
  return result.status === 'ok'
}

export function clearMarks(root: HTMLElement): void {
  root.querySelectorAll('.is-ok, .is-wrong, .is-empty').forEach((el) => {
    el.classList.remove('is-ok', 'is-wrong', 'is-empty')
    el.removeAttribute('aria-invalid')
    el.removeAttribute('aria-describedby')
    ;(el as HTMLElement).title = ''
    delete (el as HTMLElement).dataset.hint
  })
}

/** Samenvatting onder de opgave, met de unieke formaattips. */
export function feedbackHtml(results: FieldResult[]): string {
  const correct = results.filter((r) => r.status === 'ok').length
  const hints = [...new Set(results.flatMap((r) => (r.status === 'format' ? [t().hints[r.hint]] : [])))]
  const f = t().feedback
  const empty = results.some((r) => r.status === 'empty')
  const all = correct === results.length
  return `
    <p class="feedback ${all ? 'feedback-ok' : 'feedback-wrong'}">
      ${all ? f.allCorrect : f.summary(correct, results.length)}
      ${!all && empty ? f.notAllFilled : ''}
    </p>
    ${all ? '' : `<p class="legend">${f.legend}</p>`}
    ${hints.length ? `<ul class="hints">${hints.map((h, i) => `<li id="hint-${i}">${h}</li>`).join('')}</ul>` : ''}`
}

/** Toon de samenvatting en koppel elke formaattip aan de velden waarvoor ze geldt (issue #8). */
export function showFeedback(area: HTMLElement, form: HTMLElement, results: FieldResult[]): void {
  area.innerHTML = feedbackHtml(results)
  const ids = new Map([...area.querySelectorAll('.hints li')].map((li) => [li.textContent, li.id]))
  form.querySelectorAll<HTMLElement>('[data-hint]').forEach((el) => {
    const id = ids.get(el.dataset.hint!)
    if (id) el.setAttribute('aria-describedby', id)
  })
}

/** Groot getal met een smalle spatie als duizendtalscheiding (131 070): een punt zou op een IP-adres lijken. */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
}

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Toon de (net opgebouwde) oplossing: focus op de kop "Oplossing" (een schermlezer leest dan niet de
 * hele oplossing ineens voor, issue #16) en scroll ernaartoe, zonder animatie bij verminderde beweging (issue #18).
 */
export function showSolution(solution: HTMLElement): void {
  solution.hidden = false
  const heading = solution.querySelector<HTMLElement>('h2')
  if (heading) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
  solution.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
