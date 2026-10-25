import { t } from '../i18n'
import { escapeHtml } from '../lib/html'
import { generateIpv6 } from '../lib/generators'
import { checkShortened, formatFull, shortest, stripLeadingZeros, validShortenings, zeroRuns } from '../lib/ipv6'
import type { Page } from '../router'
import { clearMarks, focusAfterNew, levelSelectHtml, markField, outdatedNoticeHtml, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { wireFormNavigation } from '../ui/navigation'
import { fieldAnswer, overviewHtml } from '../ui/overview'

const PATH = '/ipv6'

export const ipv6Page: Page = (root) => {
  const m = t()
  const v = m.ipv6
  const state = readState(PATH)
  const ex = generateIpv6(state.rng, state.level)
  const { groups } = ex
  // <wbr> na elke dubbele punt: op een smal scherm breekt het adres enkel tussen twee blokken.
  const given = formatFull(groups, ex.upper).replaceAll(':', ':<wbr>')

  root.innerHTML = `
    <h1>${v.title}</h1>
    <p class="subtitle">${v.subtitle}</p>
    <p class="lead">${v.lead}</p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <button type="button" class="btn" data-action="new">${m.common.newExercise}</button>
    </div>
    ${outdatedNoticeHtml(state)}

    <div class="panel assignment">
      <div><span class="assignment-label">${v.given}</span><span class="assignment-value mono ipv6-given">${given}</span></div>
    </div>

    <form class="panel exercise" novalidate>
      <div class="qa qa-2">
        <label class="qa-label" for="ipv6">${v.answer}</label>
        <input id="ipv6" class="ipv6-input mono" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary">${m.common.check}</button>
        <button type="button" class="btn" data-action="solution">${m.common.showSolution}</button>
      </div>
      <div class="feedback-area" aria-live="polite"></div>
    </form>

    <section class="panel solution" hidden></section>`

  const form = root.querySelector('form')!
  const feedback = root.querySelector<HTMLElement>('.feedback-area')!
  const solution = root.querySelector<HTMLElement>('.solution')!
  const input = root.querySelector<HTMLInputElement>('#ipv6')!
  wireToolbar(root, state)
  wireFormNavigation(form)
  focusAfterNew(input)

  const answer = () => {
    const result = checkShortened(input.value, groups)
    // <wbr> na elke dubbele punt: op gsm breekt het juiste antwoord enkel tussen twee blokken.
    return fieldAnswer(v.answer, shortest(groups).replaceAll(':', ':<wbr>'), input.value.trim(), result, input, false)
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    clearMarks(form)
    const result = checkShortened(input.value, groups)
    markField(input, result)
    showFeedback(feedback, form, [result])
    // Een zichtbare oplossing mee bijwerken, anders toont ze nog het vorige antwoord (issue #3).
    if (!solution.hidden) renderSolution()
  })

  const renderSolution = () => {
    const runs = zeroRuns(groups)
    const best = shortest(groups)
    const longest = runs.reduce((a, b) => (b.length > a.length ? b : a))
    const inLongest = (i: number) => i >= longest.start && i < longest.start + longest.length
    const others = validShortenings(groups).filter((s) => s !== best)
    const blocks = groups.map((g) => {
      const full = g.toString(16).padStart(4, '0')
      const short = g.toString(16)
      return { full, short, zeros: full.length - short.length }
    })
    // Elk item (bv. 0db8 → db8) blijft samen op één regel.
    const mono = (text: string) => `<span class="mono nowrap">${text}</span>`

    // Regel 1: per blok de voorloopnullen (gemarkeerd + doorstreept) en hoeveel er wegvallen.
    const rule1Cards = blocks
      .map(
        (b, i) => `
          <div role="listitem" class="v6-group${b.zeros ? ' v6-changed' : ''}">
            <span class="v6-nr">${v.colBlock} ${i + 1}</span>
            <span class="v6-full mono">${b.zeros ? `<s class="v6-lz">${b.full.slice(0, b.zeros)}</s>` : ''}${b.full.slice(b.zeros)}</span>
            <svg class="v6-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v9M2.5 6.5 6 10l3.5-3.5"/></svg>
            <span class="v6-short mono">${b.short}</span>
            <span class="v6-removed${b.zeros ? '' : ' muted'}">${v.removed(b.zeros)}</span>
          </div>`,
      )
      .join('')
    // Elk aangepast blok één keer vermelden (bv. 0000 → 0 komt vaak meermaals voor).
    const changed = [...new Set(blocks.filter((b) => b.zeros).map((b) => `${b.full} → ${b.short}`))]
    const unchanged = [...new Set(blocks.filter((b) => !b.zeros).map((b) => b.full))]

    // Regel 2: het adres na regel 1, met de 0-reeksen en de gekozen reeks voor ::.
    const rule2Chips = blocks
      .map(
        (b, i) =>
          `<span class="v6-chip mono${groups[i] === 0 ? ' v6-zero' : ''}${inLongest(i) ? ' v6-run' : ''}">${b.short}</span>`,
      )
      .join('<span class="v6-colon" aria-hidden="true">:</span>')

    solution.innerHTML = `
      <h2>${m.common.solution}</h2>

      <h3>${m.common.overview}</h3>
      ${overviewHtml([answer()])}

      <section class="v6-rule">
        <h3>${v.rule1Title}</h3>
        <p>${v.rule1Intro}</p>
        <div class="v6-groups" role="list" aria-label="${v.rule1Title}">${rule1Cards}</div>
        <p class="bs-split"><span class="bs-key v6-key-lz"></span>${v.leadingZeros}</p>
        <ul class="v6-list">
          ${changed.length ? `<li>${v.changed(changed.map(mono).join(' · '))}</li>` : ''}
          ${unchanged.length ? `<li>${v.unchanged(unchanged.map(mono).join(', '))}</li>` : ''}
        </ul>
        <p class="v6-result">${v.result1(stripLeadingZeros(groups))}</p>
      </section>

      <section class="v6-rule">
        <h3>${v.rule2Title}</h3>
        <p>${v.rule2Intro}</p>
        <p class="v6-strip">${rule2Chips}</p>
        <p class="bs-split"><span class="bs-key v6-key-zero"></span>${v.zeroRun} <span class="bs-key v6-key-run"></span>::</p>
        <p class="v6-result">${v.rule2Chosen(longest.length, longest.start + 1, best)}</p>
        ${others.length ? `<p>${v.alternatives(others.map((s) => mono(escapeHtml(s))).join(', '))}</p>` : ''}
        <p class="muted small">${v.once}</p>
      </section>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
