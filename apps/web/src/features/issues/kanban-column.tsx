import type { Issue, IssueStatus } from '@lynx/types'
import { cn } from '@lynx/shared'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { KanbanCard } from './kanban-card'
import { STATUS_DOT_COLORS } from './status-priority'

export function KanbanColumn({
  status,
  label,
  issues,
  onSelectIssue,
}: {
  status: IssueStatus
  label: string
  issues: Issue[]
  onSelectIssue: (issueId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <span className={cn('h-2 w-2 rounded-full', STATUS_DOT_COLORS[status])} />
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-muted-foreground text-xs">{issues.length}</span>
      </div>

      <SortableContext
        items={issues.map((issue) => issue.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-16 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors',
            isOver ? 'border-accent' : 'border-border',
          )}
        >
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} onClick={() => onSelectIssue(issue.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
