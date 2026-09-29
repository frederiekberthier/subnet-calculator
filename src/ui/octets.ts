// Vier invoervakjes voor een adres (decimaal of binair), met automatisch doorspringen.

export type OctetKind = 'dec' | 'bin'

export function octetInputsHtml(name: string, kind: OctetKind, label: string): string {
  const attrs = `inputmode="numeric" maxlength="${kind === 'bin' ? 8 : 3}"`
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

/** Invoer filteren en naar het volgende vakje springen wanneer een byte vol is of bij een punt. */
export function wireOctetInputs(root: HTMLElement): void {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input.octet')]
  // Na de laatste byte van een adres: naar het volgende invoerveld in het formulier (bv. de prefix).
  const fields = [...root.querySelectorAll<HTMLInputElement>('input:not([type="radio"])')]
  inputs.forEach((input, i) => {
    const binary = input.closest('.octets-bin') !== null
    const next = fields[fields.indexOf(input) + 1]
    input.addEventListener('keydown', (e) => {
      if ((e.key === '.' || e.key === ' ') && !binary) {
        e.preventDefault()
        if (input.value !== '') next?.focus()
      }
      if (e.key === 'Backspace' && input.value === '' && i > 0) {
        e.preventDefault()
        inputs[i - 1].focus()
      }
    })
    input.addEventListener('input', () => {
      const cleaned = input.value.replace(binary ? /[^01]/g : /\D/g, '')
      if (cleaned !== input.value) input.value = cleaned
      const full = binary ? cleaned.length === 8 : cleaned.length === 3 || Number(cleaned) * 10 > 255
      if (full && next && document.activeElement === input) {
        next.focus()
        next.select()
      }
    })
  })
}

export function octetValues(root: HTMLElement, name: string): string[] {
  return [...root.querySelectorAll<HTMLInputElement>(`input.octet[data-field="${name}"]`)].map((i) => i.value)
}

export function octetInputs(root: HTMLElement, name: string): HTMLInputElement[] {
  return [...root.querySelectorAll<HTMLInputElement>(`input.octet[data-field="${name}"]`)]
}
