// Keuzeknoppen (radio's als segmenten), groot genoeg om op gsm aan te tikken.

/** Opties als [waarde, label]: de waarde blijft gelijk in elke taal, het label wordt vertaald. */
export function choiceHtml(name: string, label: string, options: ReadonlyArray<readonly [value: string, label: string]>): string {
  return `
    <div class="choice" role="radiogroup" aria-label="${label}" data-choice="${name}">
      ${options
        .map(([value, text]) => `<label><input type="radio" name="${name}" value="${value}"><span>${text}</span></label>`)
        .join('')}
    </div>`
}

export function choiceValue(root: HTMLElement, name: string): string | null {
  return root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null
}

export function choiceGroup(root: HTMLElement, name: string): HTMLElement {
  return root.querySelector<HTMLElement>(`[data-choice="${name}"]`)!
}
