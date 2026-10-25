// Navigatie door een oefenformulier, zodat de student zo weinig mogelijk zelf moet klikken:
// - getalvakken met data-max springen door zodra er geen cijfer meer bij kan (isComplete);
// - Enter (of "Volgende" op een gsm-klavier) gaat naar het volgende veld; is alles ingevuld, dan controleren;
// - na het aanklikken van een keuzeknop gaat de focus naar het volgende veld.
// Nooit op basis van het juiste antwoord: dat zou de oplossing verklappen.
import { isComplete } from '../lib/check'

export function wireFormNavigation(form: HTMLFormElement): void {
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
  // "Stops" in de volgorde van de pagina: tekstvakken, keuzegroepen (als één geheel) en tot slot Controleer.
  const stops = [...form.querySelectorAll<HTMLElement>('input:not([type="radio"]), .choice'), submit]
  const textInputs = stops.filter((s): s is HTMLInputElement => s instanceof HTMLInputElement)
  const groups = stops.filter((s) => s.classList.contains('choice'))

  const allFilled = () =>
    textInputs.every((input) => input.value.trim() !== '') && groups.every((group) => group.querySelector('input:checked'))

  const focusStop = (stop: HTMLElement | undefined) => {
    if (!stop) return
    if (stop.classList.contains('choice')) {
      // Focus op de gekozen knop van de groep, anders op de eerste (focus kiest niets).
      stop.querySelector<HTMLInputElement>('input:checked, input')?.focus()
    } else {
      stop.focus()
      if (stop instanceof HTMLInputElement) stop.select()
    }
  }

  /** Enter: alles ingevuld of geen veld meer → controleren, anders naar de volgende stop. */
  const onEnter = (from: HTMLElement) => {
    const next = stops[stops.indexOf(from) + 1]
    if (allFilled() || next === submit) form.requestSubmit()
    else focusStop(next)
  }

  textInputs.forEach((input) => {
    // Gsm-klavier: "Volgende" i.p.v. "Ga"; het laatste veld vóór Controleer toont "Klaar".
    input.enterKeyHint = stops[stops.indexOf(input) + 1] === submit ? 'done' : 'next'
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing) return
      e.preventDefault()
      onEnter(input)
    })
    const max = Number(input.dataset.max)
    if (max) {
      input.addEventListener('input', () => {
        if (document.activeElement === input && isComplete(input.value, max)) focusStop(stops[stops.indexOf(input) + 1])
      })
    }
  })

  groups.forEach((group) => {
    // Enkel na een klik of tik doorspringen: met de pijltjestoetsen wijzigt de keuze ook (change),
    // en dan moet de student nog verder kunnen pijlen. Met het toetsenbord: Enter om verder te gaan.
    let pointer = false
    group.addEventListener('pointerdown', () => (pointer = true))
    group.addEventListener('change', () => {
      if (pointer) focusStop(stops[stops.indexOf(group) + 1])
      pointer = false
    })
    group.addEventListener('keydown', (e) => {
      pointer = false // toetsenbord: niet automatisch verder
      if (e.key !== 'Enter') return
      e.preventDefault()
      onEnter(group)
    })
  })
}
