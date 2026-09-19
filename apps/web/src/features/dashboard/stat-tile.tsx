import { formatCount } from './format-count'

export function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-surface rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{formatCount(value)}</p>
    </div>
  )
}
