import { describe, expect, it } from 'vitest'

import { formatCount } from './format-count'

describe('formatCount', () => {
  it('formats small numbers with thousands separators', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(42)).toBe('42')
    expect(formatCount(1284)).toBe('1,284')
    expect(formatCount(9999)).toBe('9,999')
  })

  it('switches to compact notation at the 10,000 threshold', () => {
    expect(formatCount(10_000)).toBe('10K')
    expect(formatCount(12_900)).toBe('13K')
    expect(formatCount(1_200_000)).toBe('1.2M')
  })
})
