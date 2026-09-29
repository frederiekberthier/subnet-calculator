// Keuzeknoppen (radio's als segmenten), groot genoeg om op gsm aan te tikken.

export function choiceHtml(name: string, label: string, options: readonly string[]): string {
  return `
    <div class="choice" role="radiogroup" aria-label="${label}" data-choice="${name}">
      ${options
        .map((o) => `<label><input type="radio" name="${name}" value="${o}"><span>${o}</span></label>`)
        .join('')}
    </div>`
}

export function choiceValue(root: HTMLElement, name: string): string | null {
  return root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? null
}

export function choiceGroup(root: HTMLElement, name: string): HTMLElement {
  return root.querySelector<HTMLElement>(`[data-choice="${name}"]`)!
}
