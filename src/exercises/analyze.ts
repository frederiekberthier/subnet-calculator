import { t } from '../i18n'
import { checkChoice, checkInteger, checkPrefix } from '../lib/check'
import { generateAnalyze } from '../lib/generators'
import { formatIp, prefixToMask, toOctets } from '../lib/ipv4'
import type { Page } from '../router'
import { andTableHtml } from '../ui/andtable'
import { choiceGroup, choiceHtml, choiceValue } from '../ui/choice'
import { clearMarks, focusAfterNew, formatCount, levelSelectHtml, outdatedNoticeHtml, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputs, octetInputsHtml, wireOctetInputs } from '../ui/octets'
import { addressAnswer, fieldAnswer, overviewHtml, type Answer } from '../ui/overview'

const PATH = '/analyse'
const CLASSES = ['A', 'B', 'C', 'D', 'E'] as const

/** Bereik van de eerste byte per klasse. */
const CLASS_RANGES: Record<string, readonly [number, number]> = {
  A: [0, 127],
  B: [128, 191],
  C: [192, 223],
  D: [224, 239],
  E: [240, 255],
}

export const analyzePage: Page = (root) => {
  const m = t()
  const state = readState(PATH)
  const ex = generateAnalyze(state.rng, state.level)
  const { answer } = ex
  const mask = prefixToMask(ex.prefix)
  const maskGivenDotted = ex.maskNotation === 'dotted'
  // De waarde (public/private) is in elke taal gelijk; enkel het label wordt vertaald.
  const scopes = [
    ['public', m.analysis.public],
    ['private', m.analysis.private],
  ] as const
  const scope = answer.isPrivate ? 'private' : 'public'
  const scopeLabel = answer.isPrivate ? m.analysis.private : m.analysis.public
  const scopeLabelOf = (value: string | null) => scopes.find(([v]) => v === value)?.[1] ?? ''

  const addressRow = (name: string, label: string) => `
    <div class="qa-label">${label}</div>
    ${octetInputsHtml(name, 'dec', label)}`

  root.innerHTML = `
    <h1>${m.analysis.title}</h1>
    <p class="subtitle">${m.analysis.subtitle}</p>
    <p class="lead">${m.analysis.lead}</p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <button type="button" class="btn" data-action="new">${m.common.newExercise}</button>
    </div>
    ${outdatedNoticeHtml(state)}

    <div class="panel assignment">
      <div><span class="assignment-label">${m.common.ipAddress}</span><span class="assignment-value mono">${formatIp(ex.ip)}</span></div>
      <div><span class="assignment-label">${m.common.subnetMask}</span><span class="assignment-value mono">${
        maskGivenDotted ? formatIp(mask) : `/${ex.prefix}`
      }</span></div>
    </div>

    <form class="panel exercise" novalidate>
      <div class="qa qa-2">
        ${
          maskGivenDotted
            ? `<label class="qa-label" for="prefix">${m.common.prefix}</label>
               <div class="prefix-input"><span>/</span><input id="prefix" inputmode="numeric" maxlength="2" autocomplete="off"></div>`
            : addressRow('mask', m.common.subnetMask)
        }
        ${addressRow('network', m.common.networkAddress)}
        ${addressRow('first', m.common.firstUsable)}
        ${addressRow('last', m.common.lastUsable)}
        ${addressRow('broadcast', m.common.broadcast)}

        <label class="qa-label" for="hosts">${m.common.usableHosts}</label>
        <input id="hosts" class="hosts-input mono" inputmode="numeric" autocomplete="off">

        <div class="qa-label">${m.analysis.class}</div>
        ${choiceHtml('class', m.analysis.class, CLASSES.map((c) => [c, c] as const))}

        <div class="qa-label">${m.analysis.scope}</div>
        ${choiceHtml('scope', m.analysis.scope, scopes)}
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
        ? fieldAnswer(m.common.prefix, `/${ex.prefix}`, prefixInput.value ? `/${prefixInput.value}` : '', checkPrefix(prefixInput.value, ex.prefix), prefixInput, mark)
        : address('mask', m.common.subnetMask, mask),
      address('network', m.common.networkAddress, answer.network),
      address('first', m.common.firstUsable, answer.firstHost),
      address('last', m.common.lastUsable, answer.lastHost),
      address('broadcast', m.common.broadcast, answer.broadcast),
      fieldAnswer(m.common.usableHosts, String(answer.hostCount), hostsInput.value, checkInteger(hostsInput.value, answer.hostCount), hostsInput, mark),
      fieldAnswer(m.analysis.class, answer.ipClass, cls ?? '', checkChoice(cls, answer.ipClass), choiceGroup(form, 'class'), mark),
      fieldAnswer(m.analysis.scope, scopeLabel, scopeLabelOf(sc), checkChoice(sc, scope), choiceGroup(form, 'scope'), mark),
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
    const [from, to] = CLASS_RANGES[answer.ipClass]
    const a = m.analysis
    solution.innerHTML = `
      <h2>${m.common.solution}</h2>

      <h3>${m.common.overview}</h3>
      ${overviewHtml(answers)}

      <h3>${m.common.binaryWork}</h3>
      ${andTableHtml(
        [
          { label: m.common.ipAddress, value: ex.ip },
          { label: m.common.subnetMask, value: mask },
          { label: m.common.networkAddress, value: answer.network, ruleAbove: 'AND' },
          { label: m.common.broadcast, value: answer.broadcast },
        ],
        ex.prefix,
      )}

      <ol class="steps">
        <li>${a.stepMask(ex.prefix, formatIp(mask))}</li>
        <li>${a.stepNetwork(hostBits, formatIp(answer.network))}</li>
        <li>${a.stepBroadcast(formatIp(answer.broadcast))}</li>
        <li>${a.stepFirstLast(formatIp(answer.firstHost), formatIp(answer.lastHost))}</li>
        <li>${a.stepHosts(hostBits, formatCount(2 ** hostBits), formatCount(answer.hostCount))}</li>
        <li>${a.stepClass(first, from, to, answer.ipClass)}</li>
        <li>${answer.isPrivate ? a.stepPrivate : a.stepPublic} ${a.privateRanges}</li>
      </ol>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
