// Gedeelde bouwstenen voor de oefenpagina's: instellingen in de URL, werkbalk en veldfeedback.
import type { FieldResult } from '../lib/check'
import { LEVEL_NAMES, LEVELS, type Level } from '../lib/generators'
import { createRng, parseSeed, randomSeed, type Rng } from '../lib/random'

export interface ExerciseState {
  path: string
  params: URLSearchParams
  seed: number
  level: Level
  rng: Rng
}

/**
 * Leest seed en niveau uit de hash (#/pad?seed=..&niveau=..).
 * Zonder seed wordt er een gekozen en in de URL gezet, zodat de opgave altijd deelbaar is.
 */
export function readState(path: string): ExerciseState {
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '')
  let seed = parseSeed(params.get('seed'))
  if (seed === null) {
    seed = randomSeed()
    params.set('seed', String(seed))
    // replaceState triggert geen hashchange, dus geen dubbele render.
    history.replaceState(null, '', `#${path}?${params}`)
  }
  const n = Number(params.get('niveau'))
  const level: Level = LEVELS.includes(n as Level) ? (n as Level) : 1
  return { path, params, seed, level, rng: createRng(seed) }
}

/** Naar een nieuwe opgave met (eventueel) gewijzigde instellingen. */
export function goToNew(state: ExerciseState, changes: Record<string, string> = {}): void {
  const params = new URLSearchParams(state.params)
  for (const [k, v] of Object.entries(changes)) params.set(k, v)
  params.set('seed', String(randomSeed()))
  location.hash = `#${state.path}?${params}`
}

export function levelSelectHtml(level: Level): string {
  return `
    <label class="control">Niveau
      <select data-setting="niveau">
        ${LEVELS.map((l) => `<option value="${l}" ${l === level ? 'selected' : ''}>${LEVEL_NAMES[l]}</option>`).join('')}
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
  input.title = result.status === 'format' ? result.hint : ''
  input.setAttribute('aria-invalid', String(result.status !== 'ok'))
  return result.status === 'ok'
}

export function clearMarks(root: HTMLElement): void {
  root.querySelectorAll('.is-ok, .is-wrong, .is-empty').forEach((el) => {
    el.classList.remove('is-ok', 'is-wrong', 'is-empty')
    el.removeAttribute('aria-invalid')
    ;(el as HTMLElement).title = ''
  })
}

/** Samenvatting onder de opgave, met de unieke formaattips. */
export function feedbackHtml(results: FieldResult[]): string {
  const correct = results.filter((r) => r.status === 'ok').length
  const hints = [...new Set(results.flatMap((r) => (r.status === 'format' ? [r.hint] : [])))]
  const empty = results.some((r) => r.status === 'empty')
  const all = correct === results.length
  return `
    <p class="feedback ${all ? 'feedback-ok' : 'feedback-wrong'}">
      ${all ? 'Alles juist, goed gedaan!' : `${correct} van ${results.length} velden juist.`}
      ${!all && empty ? ' Nog niet alle velden zijn ingevuld.' : ''}
    </p>
    ${hints.length ? `<ul class="hints">${hints.map((h) => `<li>${h}</li>`).join('')}</ul>` : ''}`
}

/** Groot getal met een smalle spatie als duizendtalscheiding (131 070): een punt zou op een IP-adres lijken. */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
}

/** Toon de (net opgebouwde) oplossing en scroll ernaartoe. */
export function showSolution(solution: HTMLElement): void {
  solution.hidden = false
  solution.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
