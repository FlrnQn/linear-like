const COMPACT_THRESHOLD = 10_000

export function formatCount(value: number): string {
  if (value >= COMPACT_THRESHOLD) {
    return new Intl.NumberFormat(undefined, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value)
  }
  return value.toLocaleString()
}
