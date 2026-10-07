import { t } from '../i18n'
import { checkBinaryOctet, checkDecimalOctet, checkPrefix, type FieldResult } from '../lib/check'
import { generateBinary, type Direction } from '../lib/generators'
import { formatBinary, formatIp, prefixToMask, toOctets } from '../lib/ipv4'
import type { Page } from '../router'
import { bitStripHtml } from '../ui/bitstrip'
import { clearMarks, focusAfterNew, levelSelectHtml, outdatedNoticeHtml, markField, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputs, octetInputsHtml, octetValues, wireOctetInputs } from '../ui/octets'

const PATH = '/omrekenen'
/** Waarden van de richting in de URL; de labels komen uit het woordenboek. */
const DIRECTIONS = ['willekeurig', 'dec2bin', 'bin2dec'] as const

export const binaryPage: Page = (root) => {
  const m = t()
  const state = readState(PATH, ['niveau', 'richting'])
  const choice = state.params.get('richting') ?? 'willekeurig'
  const direction: Direction | undefined = choice === 'dec2bin' || choice === 'bin2dec' ? choice : undefined
  const ex = generateBinary(state.rng, state.level, direction)
  const mask = prefixToMask(ex.prefix)
  const toBinary = ex.direction === 'dec2bin'
  const answerKind = toBinary ? 'bin' : 'dec'
  // <wbr> na elke punt: op smalle schermen breekt een binair adres enkel tussen twee bytes.
  const show = (v: number) => (toBinary ? formatIp(v) : formatBinary(v)).replaceAll('.', '.<wbr>')

  root.innerHTML = `
    <h1>${m.convert.title}</h1>
    <p class="subtitle">${m.convert.subtitle}</p>
    <p class="lead">
      ${toBinary ? m.convert.leadToBinary : m.convert.leadToDecimal}
      ${m.convert.leadPrefix}
    </p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <label class="control">${m.convert.direction}
        <select data-setting="richting">
          ${DIRECTIONS.map((v) => `<option value="${v}" ${v === choice ? 'selected' : ''}>${m.convert.directions[v]}</option>`).join('')}
        </select>
      </label>
      <button type="button" class="btn" data-action="new">${m.common.newExercise}</button>
    </div>
    ${outdatedNoticeHtml(state)}

    <form class="panel exercise" novalidate>
      <div class="qa">
        <div class="qa-label">${m.common.ipAddress}</div>
        <div class="given mono">${show(ex.ip)}</div>
        ${octetInputsHtml('ip', answerKind, m.common.ipAddress)}

        <div class="qa-label">${m.common.subnetMask}</div>
        <div class="given mono">${show(mask)}</div>
        ${octetInputsHtml('mask', answerKind, m.common.subnetMask)}

        <label class="qa-label" for="prefix">${m.common.prefix}</label>
        <div class="given muted">${m.convert.prefixHint}</div>
        <div class="prefix-input"><span>/</span><input id="prefix" inputmode="numeric" maxlength="3" autocomplete="off"></div>
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
  const prefixInput = root.querySelector<HTMLInputElement>('#prefix')!
  wireToolbar(root, state)
  wireOctetInputs(form)
  prefixInput.addEventListener('input', () => {
    prefixInput.value = prefixInput.value.replace(/\D/g, '')
  })
  focusAfterNew(octetInputs(form, 'ip')[0])

  const checkOctet = toBinary ? checkBinaryOctet : checkDecimalOctet
  const fields = [
    ['ip', ex.ip],
    ['mask', mask],
  ] as const

  /** Per byte het antwoord van de student als het ingevuld maar fout is, anders null. */
  const wrongAnswers = (name: 'ip' | 'mask', value: number) => {
    const expected = toOctets(value)
    return octetValues(form, name).map((text, i) => {
      const status = checkOctet(text, expected[i]).status
      return status === 'wrong' || status === 'format' ? text.trim() : null
    })
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    clearMarks(form)
    const results: FieldResult[] = []
    for (const [name, value] of fields) {
      const expected = toOctets(value)
      const inputs = octetInputs(form, name)
      octetValues(form, name).forEach((text, i) => {
        const r = checkOctet(text, expected[i])
        markField(inputs[i], r)
        results.push(r)
      })
    }
    const r = checkPrefix(prefixInput.value, ex.prefix)
    markField(prefixInput, r)
    results.push(r)
    showFeedback(feedback, form, results)
    // Een zichtbare oplossing mee bijwerken, anders toont ze nog de vorige antwoorden (issue #3).
    if (!solution.hidden) renderSolution()
  })

  // De oplossing wordt pas bij het klikken opgebouwd, zodat foute bytes van de student gemarkeerd worden.
  const renderSolution = () => {
    solution.innerHTML = `
      <h2>${m.common.solution}</h2>
      ${bitStripHtml(ex.ip, { title: `${m.common.ipAddress} ${formatIp(ex.ip)}`, wrongAnswers: wrongAnswers('ip', ex.ip) })}
      ${bitStripHtml(mask, { title: `${m.common.subnetMask} ${formatIp(mask)}`, prefix: ex.prefix, wrongAnswers: wrongAnswers('mask', mask) })}
      <p>${m.convert.prefixExplained(ex.prefix)}</p>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
