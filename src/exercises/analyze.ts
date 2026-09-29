import { checkChoice, checkInteger, checkPrefix } from '../lib/check'
import { generateAnalyze } from '../lib/generators'
import { formatIp, prefixToMask, toOctets } from '../lib/ipv4'
import type { Page } from '../router'
import { andTableHtml } from '../ui/andtable'
import { choiceGroup, choiceHtml, choiceValue } from '../ui/choice'
import { clearMarks, focusAfterNew, formatCount, levelSelectHtml, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputs, octetInputsHtml, wireOctetInputs } from '../ui/octets'
import { addressAnswer, fieldAnswer, overviewHtml, type Answer } from '../ui/overview'

const PATH = '/analyse'
const CLASSES = ['A', 'B', 'C', 'D', 'E'] as const
const SCOPES = ['Publiek', 'Privaat'] as const

const CLASS_RANGES: Record<string, string> = {
  A: '0 en 127',
  B: '128 en 191',
  C: '192 en 223',
  D: '224 en 239',
  E: '240 en 255',
}

export const analyzePage: Page = (root) => {
  const state = readState(PATH)
  const ex = generateAnalyze(state.rng, state.level)
  const { answer } = ex
  const mask = prefixToMask(ex.prefix)
  const maskGivenDotted = ex.maskNotation === 'dotted'
  const scope = answer.isPrivate ? 'Privaat' : 'Publiek'

  const addressRow = (name: string, label: string) => `
    <div class="qa-label">${label}</div>
    ${octetInputsHtml(name, 'dec', label)}`

  root.innerHTML = `
    <h1>2. Adresanalyse</h1>
    <p class="subtitle">netwerk, bruikbare adressen en broadcast</p>
    <p class="lead">
      Bepaal voor dit IP-adres het netwerkadres, het eerste en laatste bruikbare adres, het broadcastadres en
      het aantal bruikbare hostadressen. Geef ook de klasse, of het adres publiek of privaat is, en het
      subnetmasker in de andere notatie.
    </p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <button type="button" class="btn" data-action="new">Nieuwe oefening</button>
    </div>

    <div class="panel assignment">
      <div><span class="assignment-label">IP-adres</span><span class="assignment-value mono">${formatIp(ex.ip)}</span></div>
      <div><span class="assignment-label">Subnetmasker</span><span class="assignment-value mono">${
        maskGivenDotted ? formatIp(mask) : `/${ex.prefix}`
      }</span></div>
    </div>

    <form class="panel exercise" novalidate>
      <div class="qa qa-2">
        ${
          maskGivenDotted
            ? `<label class="qa-label" for="prefix">Prefix</label>
               <div class="prefix-input"><span>/</span><input id="prefix" inputmode="numeric" maxlength="2" autocomplete="off"></div>`
            : addressRow('mask', 'Subnetmasker')
        }
        ${addressRow('network', 'Netwerkadres')}
        ${addressRow('first', 'Eerste bruikbare adres')}
        ${addressRow('last', 'Laatste bruikbare adres')}
        ${addressRow('broadcast', 'Broadcastadres')}

        <label class="qa-label" for="hosts">Aantal bruikbare hostadressen</label>
        <input id="hosts" class="hosts-input mono" inputmode="numeric" autocomplete="off">

        <div class="qa-label">Klasse</div>
        ${choiceHtml('class', 'Klasse', CLASSES)}

        <div class="qa-label">Publiek of privaat</div>
        ${choiceHtml('scope', 'Publiek of privaat', SCOPES)}
      </div>

      <div class="actions">
        <button type="submit" class="btn btn-primary">Controleer</button>
        <button type="button" class="btn" data-action="solution">Toon oplossing</button>
      </div>
      <div class="feedback-area" aria-live="polite"></div>
    </form>

    <section class="panel solution" hidden></section>`

  const form = root.querySelector('form')!
  const feedback = root.querySelector<HTMLElement>('.feedback-area')!
  const solution = root.querySelector<HTMLElement>('.solution')!
  const prefixInput = root.querySelector<HTMLInputElement>('#prefix')
  const hostsInput = root.querySelector<HTMLInputElement>('#hosts')!
  wireToolbar(root, state)
  wireOctetInputs(form)
  for (const input of [prefixInput, hostsInput]) {
    input?.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '')
    })
  }
  focusAfterNew(prefixInput ?? octetInputs(form, 'mask')[0])

  /** Controleer alle velden, markeer ze en geef een overzicht per antwoord terug. */
  const evaluate = (mark: boolean): Answer[] => {
    const address = (name: string, label: string, value: number) => addressAnswer(form, name, label, value, mark)
    const cls = choiceValue(form, 'class')
    const sc = choiceValue(form, 'scope')
    return [
      prefixInput
        ? fieldAnswer('Prefix', `/${ex.prefix}`, prefixInput.value ? `/${prefixInput.value}` : '', checkPrefix(prefixInput.value, ex.prefix), prefixInput, mark)
        : address('mask', 'Subnetmasker', mask),
      address('network', 'Netwerkadres', answer.network),
      address('first', 'Eerste bruikbare adres', answer.firstHost),
      address('last', 'Laatste bruikbare adres', answer.lastHost),
      address('broadcast', 'Broadcastadres', answer.broadcast),
      fieldAnswer('Aantal bruikbare hostadressen', String(answer.hostCount), hostsInput.value, checkInteger(hostsInput.value, answer.hostCount), hostsInput, mark),
      fieldAnswer('Klasse', answer.ipClass, cls ?? '', checkChoice(cls, answer.ipClass), choiceGroup(form, 'class'), mark),
      fieldAnswer('Publiek of privaat', scope, sc ?? '', checkChoice(sc, scope), choiceGroup(form, 'scope'), mark),
    ]
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    clearMarks(form)
    showFeedback(feedback, form, evaluate(true).map((a) => a.result))
    // Een zichtbare oplossing mee bijwerken, anders toont ze nog de vorige antwoorden (issue #3).
    if (!solution.hidden) renderSolution()
  })

  const renderSolution = () => {
    const answers = evaluate(false)
    const hostBits = 32 - ex.prefix
    const first = toOctets(ex.ip)[0]
    solution.innerHTML = `
      <h2>Oplossing</h2>

      <h3>Overzicht</h3>
      ${overviewHtml(answers)}

      <h3>Binaire uitwerking</h3>
      ${andTableHtml(
        [
          { label: 'IP-adres', value: ex.ip },
          { label: 'Subnetmasker', value: mask },
          { label: 'Netwerkadres', value: answer.network, ruleAbove: 'AND' },
          { label: 'Broadcastadres', value: answer.broadcast },
        ],
        ex.prefix,
      )}

      <ol class="steps">
        <li><strong>Masker:</strong> /${ex.prefix} betekent ${ex.prefix} enen op rij: ${formatIp(mask)}.</li>
        <li><strong>Netwerkadres</strong> = IP-adres AND subnetmasker: de netwerkbits blijven, alle ${hostBits} hostbits worden 0 → <span class="mono">${formatIp(answer.network)}</span>.</li>
        <li><strong>Broadcastadres:</strong> dezelfde netwerkbits, alle hostbits op 1 → <span class="mono">${formatIp(answer.broadcast)}</span>.</li>
        <li><strong>Eerste bruikbare adres</strong> = netwerkadres + 1 → <span class="mono">${formatIp(answer.firstHost)}</span>.<br>
            <strong>Laatste bruikbare adres</strong> = broadcastadres − 1 → <span class="mono">${formatIp(answer.lastHost)}</span>.</li>
        <li><strong>Aantal bruikbare hostadressen</strong> = 2<sup>${hostBits}</sup> − 2 = ${formatCount(2 ** hostBits)} − 2 = <strong>${formatCount(answer.hostCount)}</strong>
            (netwerk- en broadcastadres zijn niet bruikbaar).</li>
        <li><strong>Klasse:</strong> de eerste byte is ${first}, die ligt tussen ${CLASS_RANGES[answer.ipClass]} → klasse <strong>${answer.ipClass}</strong>.</li>
        <li><strong>${scope}:</strong> ${
          answer.isPrivate
            ? 'het adres ligt in een privébereik (RFC 1918).'
            : 'het adres ligt niet in een van de privébereiken, dus het is publiek.'
        } Privébereiken: 10.0.0.0/8, 172.16.0.0/12 en 192.168.0.0/16.</li>
      </ol>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
