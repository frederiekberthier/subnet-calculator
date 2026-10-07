import { describe, expect, it } from 'vitest'
import type { FieldResult } from '../src/lib/check'
import { summarize } from '../src/ui/overview'

const ok: FieldResult = { status: 'ok' }
const empty: FieldResult = { status: 'empty' }
const wrong: FieldResult = { status: 'wrong' }
const format: FieldResult = { status: 'format', hint: 'byteRange' }

describe('summarize (issue #14)', () => {
  it('formaatfout gaat voor op een leeg vakje ervoor', () => {
    expect(summarize([empty, ok, format, ok])).toBe(format)
  })
  it('fout gaat voor op leeg', () => {
    expect(summarize([empty, wrong, ok, ok])).toBe(wrong)
  })
  it('alles juist geeft juist', () => {
    expect(summarize([ok, ok, ok, ok]).status).toBe('ok')
  })
})
