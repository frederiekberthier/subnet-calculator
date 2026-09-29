// Horizontale bitstrook: de 4 bytes naast elkaar, zoals in de les op het bord.
// Per byte: gewichten (128 ... 1), de bits, het decimale getal en de som.
import { escapeHtml } from '../lib/html'
import { octetToBinary, toOctets } from '../lib/ipv4'

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1]

export interface BitStripOptions {
  title: string
  /** Toon onder de bits een balk met netwerk- en hostdeel (voor een subnetmasker). */
  prefix?: number
  /** Per byte het foute antwoord van de student, of null als het juist/leeg was. */
  wrongAnswers?: (string | null)[]
}

export function bitStripHtml(value: number, { title, prefix, wrongAnswers = [] }: BitStripOptions): string {
  const bytes = toOctets(value)
    .map((octet, i) => {
      const bits = octetToBinary(octet)
      const terms = WEIGHTS.filter((w) => octet & w)
      const wrong = wrongAnswers[i]
      const bar =
        prefix === undefined
          ? ''
          : `<div class="bs-row bs-bar" aria-hidden="true">${WEIGHTS.map((_, b) => `<span class="${i * 8 + b < prefix ? 'net' : 'host'}"></span>`).join('')}</div>`
      return `
        <div class="bs-byte${wrong !== null && wrong !== undefined ? ' bs-wrong' : ''}">
          <div class="bs-row bs-weights" aria-hidden="true">${WEIGHTS.map((w) => `<span>${w}</span>`).join('')}</div>
          <div class="bs-row bs-bits" role="img" aria-label="Byte ${i + 1}: ${bits}">${[...bits].map((bit) => `<span class="${bit === '1' ? 'on' : 'off'}">${bit}</span>`).join('')}</div>
          ${bar}
          <div class="bs-dec">${octet}</div>
          <div class="bs-sum">${terms.length ? terms.join('+') : '0'}</div>
          ${wrong !== null && wrong !== undefined ? `<div class="bs-yours">jij: <span class="mono">${escapeHtml(wrong)}</span></div>` : ''}
        </div>`
    })
    .join('')
  const split =
    prefix === undefined
      ? ''
      : `<p class="bs-split"><span class="bs-key net"></span>${prefix} netwerkbits <span class="bs-key host"></span>${32 - prefix} hostbits</p>`
  return `
    <figure class="bitstrip">
      <figcaption>${title}</figcaption>
      <div class="bs-bytes">${bytes}</div>
      ${split}
    </figure>`
}
