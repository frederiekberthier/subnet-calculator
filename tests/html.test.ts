import { describe, expect, it } from 'vitest'
import { escapeHtml } from '../src/lib/html'

describe('escapeHtml (issue #21)', () => {
  it('maakt HTML-tekens onschadelijk', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
    expect(escapeHtml("a & b 'c'")).toBe('a &amp; b &#39;c&#39;')
  })

  it('laat gewone antwoorden ongewijzigd', () => {
    expect(escapeHtml('192.168.1.10')).toBe('192.168.1.10')
    expect(escapeHtml('11000000')).toBe('11000000')
  })
})
