import { checkBinaryOctet, checkDecimalOctet, checkPrefix, type FieldResult } from '../lib/check'
import { generateBinary, type Direction } from '../lib/generators'
import { formatBinary, formatIp, prefixToMask, toOctets } from '../lib/ipv4'
import type { Page } from '../router'
import { bitStripHtml } from '../ui/bitstrip'
import { clearMarks, feedbackHtml, levelSelectHtml, markField, readState, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputs, octetInputsHtml, octetValues, wireOctetInputs } from '../ui/octets'

const PATH = '/omrekenen'
const DIRECTIONS: Record<string, string> = {
  willekeurig: 'Willekeurig',
  dec2bin: 'Decimaal → binair',
  bin2dec: 'Binair → decimaal',
}
export const binaryPage: Page = (root) => {
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
    <h1>1. Omrekenen</h1>
    <p class="subtitle">binair ↔ decimaal</p>
    <p class="lead">
      ${
        toBinary
          ? 'Zet het IP-adres en het subnetmasker om naar binair: 8 bits per byte.'
          : 'Zet het IP-adres en het subnetmasker om naar decimaal: een getal van 0 tot 255 per byte.'
      }
      Geef ook de prefix van het subnetmasker.
    </p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <label class="control">Richting
        <select data-setting="richting">
          ${Object.entries(DIRECTIONS)
            .map(([v, label]) => `<option value="${v}" ${v === choice ? 'selected' : ''}>${label}</option>`)
            .join('')}
        </select>
      </label>
      <button type="button" class="btn" data-action="new">Nieuwe oefening</button>
    </div>

    <form class="panel exercise" novalidate>
      <div class="qa">
        <div class="qa-label">IP-adres</div>
        <div class="given mono">${show(ex.ip)}</div>
        ${octetInputsHtml('ip', answerKind, 'IP-adres')}

        <div class="qa-label">Subnetmasker</div>
        <div class="given mono">${show(mask)}</div>
        ${octetInputsHtml('mask', answerKind, 'Subnetmasker')}

        <label class="qa-label" for="prefix">Prefix</label>
        <div class="given muted">aantal 1-bits in het masker</div>
        <div class="prefix-input"><span>/</span><input id="prefix" inputmode="numeric" maxlength="3" autocomplete="off"></div>
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary">Controleer</button>
        <button type="button" class="btn" data-action="solution">Toon oplossing</button>
      </div>
      <div class="feedback-area" aria-live="polite"></div>
    </form>

    <section class="panel solution" hidden aria-live="polite"></section>`

  const form = root.querySelector('form')!
  const feedback = root.querySelector<HTMLElement>('.feedback-area')!
  const solution = root.querySelector<HTMLElement>('.solution')!
  const prefixInput = root.querySelector<HTMLInputElement>('#prefix')!
  wireToolbar(root, state)
  wireOctetInputs(form)
  prefixInput.addEventListener('input', () => {
    prefixInput.value = prefixInput.value.replace(/\D/g, '')
  })
  octetInputs(form, 'ip')[0].focus()

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
    feedback.innerHTML = feedbackHtml(results)
    // Een zichtbare oplossing mee bijwerken, anders toont ze nog de vorige antwoorden (issue #3).
    if (!solution.hidden) renderSolution()
  })

  // De oplossing wordt pas bij het klikken opgebouwd, zodat foute bytes van de student gemarkeerd worden.
  const renderSolution = () => {
    solution.innerHTML = `
      <h2>Oplossing</h2>
      ${bitStripHtml(ex.ip, { title: `IP-adres ${formatIp(ex.ip)}`, wrongAnswers: wrongAnswers('ip', ex.ip) })}
      ${bitStripHtml(mask, { title: `Subnetmasker ${formatIp(mask)}`, prefix: ex.prefix, wrongAnswers: wrongAnswers('mask', mask) })}
      <p>Het subnetmasker bevat <strong>${ex.prefix}</strong> enen op rij, dus de prefix is <strong>/${ex.prefix}</strong>.</p>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
