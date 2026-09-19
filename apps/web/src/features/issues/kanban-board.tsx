import type { Issue, IssueStatus } from '@lynx/types'
import { ISSUE_STATUSES } from '@lynx/types'
import type { DragEndEvent } from '@dnd-kit/core'
import { closestCorners, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { KanbanColumn } from './kanban-column'
import { STATUS_LABEL_KEYS } from './status-priority'
import { useUpdateIssue } from './use-update-issue'

function isIssueStatus(value: string): value is IssueStatus {
  return (ISSUE_STATUSES as readonly string[]).includes(value)
}

export function KanbanBoard({
  issues,
  onSelectIssue,
}: {
  issues: Issue[]
  onSelectIssue: (issueId: string) => void
}) {
  const { t } = useTranslation()
  const updateIssue = useUpdateIssue()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const columns = useMemo(() => {
    const grouped = new Map<IssueStatus, Issue[]>(ISSUE_STATUSES.map((status) => [status, []]))
    for (const issue of issues) {
      grouped.get(issue.status)?.push(issue)
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return grouped
  }, [issues])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeIssue = issues.find((issue) => issue.id === active.id)
    if (!activeIssue) return

    const overId = String(over.id)
    const destStatus: IssueStatus = isIssueStatus(overId)
      ? overId
      : (issues.find((issue) => issue.id === overId)?.status ?? activeIssue.status)

    const destItems = (columns.get(destStatus) ?? []).filter((issue) => issue.id !== activeIssue.id)
    const overIndex = destItems.findIndex((issue) => issue.id === overId)
    const insertIndex = overIndex === -1 ? destItems.length : overIndex

    const prevSort = destItems[insertIndex - 1]?.sortOrder
    const nextSort = destItems[insertIndex]?.sortOrder
    const sortOrder =
      prevSort !== undefined && nextSort !== undefined
        ? (prevSort + nextSort) / 2
        : prevSort !== undefined
          ? prevSort + 1000
          : nextSort !== undefined
            ? nextSort - 1000
            : 0

    if (destStatus === activeIssue.status && sortOrder === activeIssue.sortOrder) return

    updateIssue.mutate({
      issueId: activeIssue.id,
      input: {
        sortOrder,
        ...(destStatus !== activeIssue.status && { status: destStatus }),
      },
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ISSUE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={t(STATUS_LABEL_KEYS[status])}
            issues={columns.get(status) ?? []}
            onSelectIssue={onSelectIssue}
          />
        ))}
      </div>
    </DndContext>
  )
}
