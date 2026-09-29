// Antwoorden controleren en als overzicht tonen: juist antwoord naast "✓ juist" / "jij: ..." / "niet ingevuld".
import { checkDecimalOctet, type FieldResult } from '../lib/check'
import { escapeHtml } from '../lib/html'
import { formatIp, toOctets } from '../lib/ipv4'
import { markField } from './exercise'
import { octetInputs, octetValues } from './octets'

export interface Answer {
  label: string
  correct: string
  given: string
  result: FieldResult
}

/** Controleer een adres in 4 vakjes (data-field = name); markeer de vakjes als mark = true. */
export function addressAnswer(form: HTMLElement, name: string, label: string, value: number, mark: boolean): Answer {
  const expected = toOctets(value)
  const texts = octetValues(form, name)
  const inputs = octetInputs(form, name)
  const results = texts.map((t, i) => checkDecimalOctet(t, expected[i]))
  if (mark) results.forEach((r, i) => markField(inputs[i], r))
  return {
    label,
    correct: formatIp(value),
    given: texts.every((t) => t.trim() === '') ? '' : texts.join('.'),
    result: results.find((r) => r.status !== 'ok') ?? results[0],
  }
}

/** Controleer één veld (invoer of keuze); markeer het element als mark = true. */
export function fieldAnswer(
  label: string,
  correct: string,
  given: string,
  result: FieldResult,
  el: HTMLElement | null,
  mark: boolean,
): Answer {
  if (mark && el) markField(el, result)
  return { label, correct, given, result }
}

export function overviewHtml(answers: Answer[]): string {
  return `
    <div class="overview">
      ${answers
        .map(
          (a) => `
        <div class="ov-row ${a.result.status === 'ok' ? 'ov-ok' : a.given ? 'ov-wrong' : 'ov-empty'}">
          <span class="ov-label">${a.label}</span>
          <span class="ov-correct mono">${a.correct}</span>
          <span class="ov-given">${
            a.result.status === 'ok' ? '✓ juist' : a.given ? `jij: <span class="mono">${escapeHtml(a.given)}</span>` : 'niet ingevuld'
          }</span>
        </div>`,
        )
        .join('')}
    </div>`
}
