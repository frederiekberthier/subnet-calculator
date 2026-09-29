// Vier invoervakjes voor een adres (decimaal of binair), met automatisch doorspringen.
import { splitAddressInput } from '../lib/check'

export type OctetKind = 'dec' | 'bin'

export function octetInputsHtml(name: string, kind: OctetKind, label: string): string {
  // Decimaal: inputmode "decimal" zodat een gsm-klavier een punt (of komma) toont om door te springen.
  const attrs = kind === 'bin' ? 'inputmode="numeric" maxlength="8"' : 'inputmode="decimal" maxlength="3"'
  return `
    <div class="octets octets-${kind}" role="group" aria-label="${label}">
      ${[0, 1, 2, 3]
        .map(
          (i) =>
            `<span class="byte"><input class="octet" data-field="${name}" data-index="${i}" ${attrs} autocomplete="off" spellcheck="false" aria-label="${label}, byte ${i + 1}">${i < 3 ? '<span class="dot">.</span>' : ''}</span>`,
        )
        .join('')}
    </div>`
}

/** Scheidingsteken tussen bytes: punt, komma (Belgisch gsm-klavier) of spatie. */
const SEPARATOR = /[.,\s]/

/**
 * Invoer filteren en naar het volgende vakje springen wanneer een byte vol is of bij een scheidingsteken.
 * Plakken van een volledig adres verdeelt de bytes over de vier vakjes.
 */
export function wireOctetInputs(root: HTMLElement): void {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input.octet')]
  // Na de laatste byte van een adres: naar het volgende invoerveld in het formulier (bv. de prefix).
  const fields = [...root.querySelectorAll<HTMLInputElement>('input:not([type="radio"])')]
  const after = (el: HTMLInputElement) => fields[fields.indexOf(el) + 1]
  const focus = (el: HTMLInputElement | undefined) => {
    el?.focus()
    el?.select()
  }

  inputs.forEach((input, i) => {
    const binary = input.closest('.octets-bin') !== null
    const next = after(input)
    input.addEventListener('keydown', (e) => {
      if (SEPARATOR.test(e.key) && e.key.length === 1 && !binary) {
        e.preventDefault()
        if (input.value !== '') focus(next)
      }
      if (e.key === 'Backspace' && input.value === '' && i > 0) {
        e.preventDefault()
        inputs[i - 1].focus()
      }
    })
    input.addEventListener('paste', (e) => {
      const parts = splitAddressInput(e.clipboardData?.getData('text') ?? '', binary)
      if (parts.length === 0) return // gewone plak van één byte: de input-handler filtert
      e.preventDefault()
      const group = inputs.filter((el) => el.dataset.field === input.dataset.field)
      const start = group.indexOf(input)
      parts.slice(0, group.length - start).forEach((part, k) => (group[start + k].value = part))
      const lastFilled = group[Math.min(start + parts.length, group.length) - 1]
      focus(start + parts.length < group.length ? group[start + parts.length] : after(lastFilled))
    })
    input.addEventListener('input', () => {
      const raw = input.value
      // Op gsm komt een punt/komma vaak niet als keydown binnen maar pas hier (Android: key "Unidentified").
      const separated = !binary && SEPARATOR.test(raw)
      const cleaned = raw.replace(binary ? /[^01]/g : /\D/g, '')
      if (cleaned !== raw) input.value = cleaned
      const full = binary ? cleaned.length === 8 : cleaned.length === 3 || Number(cleaned) * 10 > 255
      if ((full || (separated && cleaned !== '')) && next && document.activeElement === input) focus(next)
    })
  })
}

export function octetValues(root: HTMLElement, name: string): string[] {
  return [...root.querySelectorAll<HTMLInputElement>(`input.octet[data-field="${name}"]`)].map((i) => i.value)
}

export function octetInputs(root: HTMLElement, name: string): HTMLInputElement[] {
  return [...root.querySelectorAll<HTMLInputElement>(`input.octet[data-field="${name}"]`)]
}
