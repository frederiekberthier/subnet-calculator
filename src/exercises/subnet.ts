import { t } from '../i18n'
import { checkInteger, checkPrefix } from '../lib/check'
import { generateSubnet } from '../lib/generators'
import { formatIp, interestingOctet, magicNumber, prefixToMask, subnetAt, toOctets, type NetworkInfo } from '../lib/ipv4'
import type { Page } from '../router'
import { andTableHtml } from '../ui/andtable'
import { clearMarks, focusAfterNew, formatCount as fmt, levelSelectHtml, outdatedNoticeHtml, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputsHtml, wireOctetInputs } from '../ui/octets'
import { addressAnswer, fieldAnswer, overviewHtml, type Answer } from '../ui/overview'

const PATH = '/subnetten'

/**
 * Naam van een subnet zoals de student ze ziet. Intern tellen we vanaf 0 (subnet i begint op
 * netwerk + i × blokgrootte), maar in de opleiding heet het eerste subnet "subnet 1".
 */
const subnetName = (index: number) => t().subnetting.name(index + 1)

/** De vier adressen die per gevraagd subnet ingevuld worden (labels uit het woordenboek). */
const SUBNET_FIELDS: ReadonlyArray<[key: keyof NetworkInfo, label: () => string]> = [
  ['network', () => t().common.networkAddress],
  ['firstHost', () => t().common.firstUsable],
  ['lastHost', () => t().common.lastUsable],
  ['broadcast', () => t().common.broadcast],
]

export const subnetPage: Page = (root) => {
  const m = t()
  const s = m.subnetting
  const state = readState(PATH)
  const ex = generateSubnet(state.rng, state.level)
  const { plan } = ex
  const oldMask = prefixToMask(ex.prefix)
  const newMask = prefixToMask(plan.newPrefix)
  const hostBits = 32 - plan.newPrefix
  const asked = ex.askIndices.map((i) => ({ index: i, info: subnetAt(plan, i) }))

  const numberRow = (id: string, label: string, prefix = '') => `
    <label class="qa-label" for="${id}">${label}</label>
    <div class="prefix-input">${prefix ? `<span>${prefix}</span>` : ''}<input id="${id}" class="num-input mono" inputmode="numeric" autocomplete="off"></div>`

  root.innerHTML = `
    <h1>${s.title}</h1>
    <p class="subtitle">${s.subtitle}</p>
    <p class="lead">${s.lead}</p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <button type="button" class="btn" data-action="new">${m.common.newExercise}</button>
    </div>
    ${outdatedNoticeHtml(state)}

    <div class="panel assignment">
      <div><span class="assignment-label">${m.common.network}</span><span class="assignment-value mono">${formatIp(ex.network)}</span></div>
      <div><span class="assignment-label">${m.common.subnetMask}</span><span class="assignment-value mono">${
        ex.maskNotation === 'dotted' ? formatIp(oldMask) : `/${ex.prefix}`
      }</span></div>
      <div><span class="assignment-label">${s.requested}</span><span class="assignment-value">${s.atLeast(ex.requested)}</span></div>
    </div>

    <form class="panel exercise" novalidate>
      <h2 class="form-heading">${s.calculation}</h2>
      <div class="qa qa-2">
        ${numberRow('borrowed', s.borrowedBits)}
        <div class="qa-label">${s.newMask}</div>
        ${octetInputsHtml('newmask', 'dec', s.newMask)}
        ${numberRow('newprefix', s.newPrefix, '/')}
        ${numberRow('subnets', s.subnetCount)}
        ${numberRow('hosts', s.hostsPerSubnet)}
      </div>

      <h2 class="form-heading">${s.writeOut}</h2>
      <div class="subnet-cards">
        ${asked
          .map(
            ({ index }) => `
          <fieldset class="subnet-card">
            <legend>${subnetName(index)}</legend>
            <div class="qa qa-2">
              ${SUBNET_FIELDS.map(([key, label]) => `<div class="qa-label">${label()}</div>${octetInputsHtml(`s${index}-${key}`, 'dec', `${subnetName(index)}, ${label()}`)}`).join('')}
            </div>
          </fieldset>`,
          )
          .join('')}
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
  const input = (id: string) => root.querySelector<HTMLInputElement>(`#${id}`)!
  const numberIds = ['borrowed', 'newprefix', 'subnets', 'hosts']
  wireToolbar(root, state)
  wireOctetInputs(form)
  for (const id of numberIds) {
    const el = input(id)
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '')
    })
  }
  focusAfterNew(input('borrowed'))

  const evaluate = (mark: boolean): Answer[] => {
    const number = (id: string, label: string, expected: number) =>
      fieldAnswer(label, fmt(expected), input(id).value, checkInteger(input(id).value, expected), input(id), mark)
    const prefixValue = input('newprefix').value
    return [
      number('borrowed', s.borrowedBits, plan.borrowedBits),
      addressAnswer(form, 'newmask', s.newMask, newMask, mark),
      fieldAnswer(s.newPrefix, `/${plan.newPrefix}`, prefixValue ? `/${prefixValue}` : '', checkPrefix(prefixValue, plan.newPrefix), input('newprefix'), mark),
      number('subnets', s.subnetCount, plan.subnetCount),
      number('hosts', s.hostsPerSubnet, plan.hostsPerSubnet),
      ...asked.flatMap(({ index, info }) =>
        SUBNET_FIELDS.map(([key, label]) => addressAnswer(form, `s${index}-${key}`, `${subnetName(index)} – ${label().toLowerCase()}`, info[key], mark)),
      ),
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
    const n = plan.borrowedBits
    const byte = interestingOctet(plan.newPrefix)
    const maskByte = toOctets(newMask)[byte]
    const magic = magicNumber(plan.newPrefix)
    const last = plan.subnetCount - 1
    const askedSet = new Set(ex.askIndices)
    const all = Array.from({ length: plan.subnetCount }, (_, i) => subnetAt(plan, i))
    const table = `
      <div class="table-scroll" tabindex="0" role="region" aria-label="${s.allSubnetsRegion}">
        <table class="subnet-table mono">
          <thead><tr><th>${s.col.subnet}</th><th>${s.col.network}</th><th>${s.col.first}</th><th>${s.col.last}</th><th>${s.col.broadcast}</th></tr></thead>
          <tbody>
            ${all
              .map(
                (sub, i) => `
              <tr class="${askedSet.has(i) ? 'asked' : ''}">
                <th scope="row">${i + 1}</th>
                <td>${formatIp(sub.network)}</td><td>${formatIp(sub.firstHost)}</td><td>${formatIp(sub.lastHost)}</td><td>${formatIp(sub.broadcast)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>`

    solution.innerHTML = `
      <h2>${m.common.solution}</h2>

      <h3>${m.common.overview}</h3>
      ${overviewHtml(answers)}

      <h3>${m.common.steps}</h3>
      <ol class="steps">
        <li>${s.stepBorrowed(ex.requested, n)}</li>
        <li>${s.stepPrefix(ex.prefix, n, plan.newPrefix, formatIp(newMask))}</li>
        <li>${s.stepCount(n, fmt(plan.subnetCount), last + 1)}</li>
        <li>${s.stepHosts(hostBits, fmt(2 ** hostBits), fmt(plan.hostsPerSubnet))}</li>
        <li>${s.stepBlock(s.byteNames[byte], maskByte, magic)}</li>
        <li>${s.stepPerSubnet}</li>
      </ol>

      <h3>${m.common.binaryWork}</h3>
      ${andTableHtml(
        [
          { label: s.oldMaskRow, value: oldMask },
          { label: s.newMaskRow, value: newMask },
          // Precies de subnetten die de student moest uitschrijven (ook het willekeurig gekozen subnet).
          ...ex.askIndices.map((i, k) => ({ label: subnetName(i), value: all[i].network, ruleAbove: k === 0 ? s.subnetsRule : undefined })),
        ],
        plan.newPrefix,
        ex.prefix,
      )}

      <h3>${s.allSubnets}</h3>
      ${
        plan.subnetCount > 16
          ? `<details class="all-subnets"><summary>${s.showAll(plan.subnetCount)}</summary>${table}</details>`
          : table
      }
      <p class="muted small">${s.askedMarked}</p>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
