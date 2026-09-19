import type { Issue } from '@lynx/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { PRIORITY_LABEL_KEYS } from './status-priority'

function KanbanCardImpl({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="border-border bg-surface cursor-grab rounded-lg border p-2 text-sm active:cursor-grabbing"
    >
      <p className="text-muted-foreground mb-1 text-xs">{issue.identifier}</p>
      <p className="line-clamp-2">{issue.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {issue.priority !== 'NO_PRIORITY' ? (
          <span className="text-muted-foreground text-xs">{t(PRIORITY_LABEL_KEYS[issue.priority])}</span>
        ) : (
          <span />
        )}
        {issue.assignee && (
          <span className="text-muted-foreground truncate text-xs">{issue.assignee.name}</span>
        )}
      </div>
    </div>
  )
}

export const KanbanCard = memo(KanbanCardImpl)
