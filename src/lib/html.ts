// Tekst veilig in HTML plaatsen (bv. antwoorden van studenten die in de oplossing teruggetoond worden).
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c])
}
