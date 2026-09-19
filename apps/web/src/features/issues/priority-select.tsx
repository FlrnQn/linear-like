import type { IssuePriority } from '@lynx/types'

import { ISSUE_PRIORITIES, PRIORITY_LABELS } from './status-priority'

export function PrioritySelect({
  value,
  onChange,
  className,
}: {
  value: IssuePriority
  onChange: (priority: IssuePriority) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IssuePriority)}
      className={
        className ??
        'border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none'
      }
    >
      {ISSUE_PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {PRIORITY_LABELS[priority]}
        </option>
      ))}
    </select>
  )
}
