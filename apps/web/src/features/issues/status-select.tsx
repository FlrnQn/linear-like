import type { IssueStatus } from '@lynx/types'

import { cn } from '@lynx/shared'

import { ISSUE_STATUSES, STATUS_DOT_COLORS, STATUS_LABELS } from './status-priority'

export function StatusSelect({
  value,
  onChange,
  className,
}: {
  value: IssueStatus
  onChange: (status: IssueStatus) => void
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_COLORS[value])} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IssueStatus)}
        className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
      >
        {ISSUE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </span>
  )
}
