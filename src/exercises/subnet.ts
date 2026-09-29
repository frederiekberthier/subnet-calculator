import { checkInteger, checkPrefix } from '../lib/check'
import { generateSubnet } from '../lib/generators'
import { formatIp, interestingOctet, magicNumber, prefixToMask, subnetAt, toOctets, type NetworkInfo } from '../lib/ipv4'
import type { Page } from '../router'
import { andTableHtml } from '../ui/andtable'
import { clearMarks, focusAfterNew, formatCount as fmt, levelSelectHtml, readState, showFeedback, showSolution, wireToolbar } from '../ui/exercise'
import { octetInputsHtml, wireOctetInputs } from '../ui/octets'
import { addressAnswer, fieldAnswer, overviewHtml, type Answer } from '../ui/overview'

const PATH = '/subnetten'
const BYTE_NAMES = ['1e', '2e', '3e', '4e']

/** De vier adressen die per gevraagd subnet ingevuld worden. */
const SUBNET_FIELDS: ReadonlyArray<[key: keyof NetworkInfo, label: string]> = [
  ['network', 'Netwerkadres'],
  ['firstHost', 'Eerste bruikbare adres'],
  ['lastHost', 'Laatste bruikbare adres'],
  ['broadcast', 'Broadcastadres'],
]

export const subnetPage: Page = (root) => {
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
    <h1>3. Subnetten</h1>
    <p class="subtitle">een netwerk opsplitsen in kleinere netwerken</p>
    <p class="lead">
      Verdeel het netwerk in minstens het gevraagde aantal even grote subnetten. Bereken hoeveel bits je leent,
      het nieuwe subnetmasker en hoeveel subnetten en bruikbare hostadressen je krijgt. Schrijf daarna de
      gevraagde subnetten volledig uit. De subnetten zijn genummerd vanaf <strong>subnet 0</strong>.
    </p>

    <div class="toolbar">
      ${levelSelectHtml(state.level)}
      <button type="button" class="btn" data-action="new">Nieuwe oefening</button>
    </div>

    <div class="panel assignment">
      <div><span class="assignment-label">Netwerk</span><span class="assignment-value mono">${formatIp(ex.network)}</span></div>
      <div><span class="assignment-label">Subnetmasker</span><span class="assignment-value mono">${
        ex.maskNotation === 'dotted' ? formatIp(oldMask) : `/${ex.prefix}`
      }</span></div>
      <div><span class="assignment-label">Gevraagd</span><span class="assignment-value">minstens ${ex.requested} netwerken</span></div>
    </div>

    <form class="panel exercise" novalidate>
      <h2 class="form-heading">Berekening</h2>
      <div class="qa qa-2">
        ${numberRow('borrowed', 'Aantal geleende bits')}
        <div class="qa-label">Nieuw subnetmasker</div>
        ${octetInputsHtml('newmask', 'dec', 'Nieuw subnetmasker')}
        ${numberRow('newprefix', 'Nieuwe prefix', '/')}
        ${numberRow('subnets', 'Aantal subnetten')}
        ${numberRow('hosts', 'Bruikbare hostadressen per subnet')}
      </div>

      <h2 class="form-heading">Subnetten uitschrijven</h2>
      <div class="subnet-cards">
        ${asked
          .map(
            ({ index }) => `
          <fieldset class="subnet-card">
            <legend>Subnet ${index}</legend>
            <div class="qa qa-2">
              ${SUBNET_FIELDS.map(([key, label]) => `<div class="qa-label">${label}</div>${octetInputsHtml(`s${index}-${key}`, 'dec', `Subnet ${index}, ${label}`)}`).join('')}
            </div>
          </fieldset>`,
          )
          .join('')}
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
      number('borrowed', 'Aantal geleende bits', plan.borrowedBits),
      addressAnswer(form, 'newmask', 'Nieuw subnetmasker', newMask, mark),
      fieldAnswer('Nieuwe prefix', `/${plan.newPrefix}`, prefixValue ? `/${prefixValue}` : '', checkPrefix(prefixValue, plan.newPrefix), input('newprefix'), mark),
      number('subnets', 'Aantal subnetten', plan.subnetCount),
      number('hosts', 'Bruikbare hostadressen per subnet', plan.hostsPerSubnet),
      ...asked.flatMap(({ index, info }) =>
        SUBNET_FIELDS.map(([key, label]) => addressAnswer(form, `s${index}-${key}`, `Subnet ${index} – ${label.toLowerCase()}`, info[key], mark)),
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
    const magic = magicNumber(plan.newPrefix)
    const last = plan.subnetCount - 1
    const askedSet = new Set(ex.askIndices)
    const all = Array.from({ length: plan.subnetCount }, (_, i) => subnetAt(plan, i))
    const table = `
      <div class="table-scroll">
        <table class="subnet-table mono">
          <thead><tr><th>Subnet</th><th>Netwerkadres</th><th>Eerste bruikbare</th><th>Laatste bruikbare</th><th>Broadcast</th></tr></thead>
          <tbody>
            ${all
              .map(
                (s, i) => `
              <tr class="${askedSet.has(i) ? 'asked' : ''}">
                <th scope="row">${i}</th>
                <td>${formatIp(s.network)}</td><td>${formatIp(s.firstHost)}</td><td>${formatIp(s.lastHost)}</td><td>${formatIp(s.broadcast)}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>`

    solution.innerHTML = `
      <h2>Oplossing</h2>

      <h3>Overzicht</h3>
      ${overviewHtml(answers)}

      <h3>Stappen</h3>
      <ol class="steps">
        <li><strong>Geleende bits:</strong> zoek het kleinste aantal bits n waarvoor 2<sup>n</sup> ≥ ${ex.requested}.
          ${n > 1 ? `2<sup>${n - 1}</sup> = ${2 ** (n - 1)} is te weinig, ` : ''}2<sup>${n}</sup> = ${2 ** n} is genoeg → <strong>${n} bit${n === 1 ? '' : 's'}</strong>.</li>
        <li><strong>Nieuwe prefix</strong> = /${ex.prefix} + ${n} = <strong>/${plan.newPrefix}</strong>
          → nieuw subnetmasker <span class="mono">${formatIp(newMask)}</span>.</li>
        <li><strong>Aantal subnetten</strong> = 2<sup>${n}</sup> = <strong>${fmt(plan.subnetCount)}</strong> (subnet 0 tot en met subnet ${last}).</li>
        <li><strong>Bruikbare hostadressen per subnet:</strong> er blijven ${hostBits} hostbits over →
          2<sup>${hostBits}</sup> − 2 = ${fmt(2 ** hostBits)} − 2 = <strong>${fmt(plan.hostsPerSubnet)}</strong>.</li>
        <li><strong>Blokgrootte:</strong> in de ${BYTE_NAMES[byte]} byte is het nieuwe masker ${toOctets(newMask)[byte]},
          dus 256 − ${toOctets(newMask)[byte]} = <strong>${magic}</strong>. Elk volgend subnet begint ${magic} hoger in de ${BYTE_NAMES[byte]} byte.</li>
        <li><strong>Per subnet:</strong> eerste bruikbare = netwerkadres + 1, broadcast = volgend netwerkadres − 1,
          laatste bruikbare = broadcast − 1.</li>
      </ol>

      <h3>Binaire uitwerking</h3>
      ${andTableHtml(
        [
          { label: 'Oud masker', value: oldMask },
          { label: 'Nieuw masker', value: newMask },
          { label: 'Subnet 0', value: all[0].network, ruleAbove: 'subnetten' },
          ...(plan.subnetCount > 2 ? [{ label: 'Subnet 1', value: all[1].network }] : []),
          { label: `Subnet ${last}`, value: all[last].network },
        ],
        plan.newPrefix,
        ex.prefix,
      )}

      <h3>Alle subnetten</h3>
      ${
        plan.subnetCount > 16
          ? `<details class="all-subnets"><summary>Toon alle ${plan.subnetCount} subnetten</summary>${table}</details>`
          : table
      }
      <p class="muted small">De gevraagde subnetten zijn gemarkeerd.</p>`
  }

  root.querySelector('[data-action="solution"]')!.addEventListener('click', () => {
    renderSolution()
    showSolution(solution)
  })
}
