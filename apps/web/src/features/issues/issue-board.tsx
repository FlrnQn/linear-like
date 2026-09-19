import type { Issue } from '@lynx/types'
import { ISSUE_STATUSES } from '@lynx/types'
import { cn } from '@lynx/shared'
import { AnimatePresence } from 'motion/react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { IssueRow } from './issue-row'
import { KanbanBoard } from './kanban-board'
import { STATUS_LABELS } from './status-priority'

type StatusFilter = (typeof ISSUE_STATUSES)[number] | 'ALL'
type ViewMode = 'list' | 'kanban'

export function IssueBoard({
  issues,
  isLoading,
  onSelectIssue,
  extraFilters,
}: {
  issues: Issue[]
  isLoading: boolean
  onSelectIssue: (issueId: string) => void
  extraFilters?: ReactNode
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [view, setView] = useState<ViewMode>('list')

  const filteredIssues =
    view === 'list' && statusFilter !== 'ALL'
      ? issues.filter((issue) => issue.status === statusFilter)
      : issues

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-border flex gap-1 rounded-lg border p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              view === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'rounded-md px-3 py-1 text-sm',
              view === 'kanban' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
            )}
          >
            Kanban
          </button>
        </div>

        {extraFilters}

        {view === 'list' && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'text-sm',
                statusFilter === 'ALL' ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              All
            </button>
            {ISSUE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'text-sm',
                  statusFilter === status ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'list' ? (
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading issues…</p>
          ) : filteredIssues.length > 0 ? (
            <AnimatePresence initial={false}>
              {filteredIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} onClick={() => onSelectIssue(issue.id)} />
              ))}
            </AnimatePresence>
          ) : (
            <p className="text-muted-foreground text-sm">No issues yet.</p>
          )}
        </div>
      ) : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading issues…</p>
      ) : (
        <KanbanBoard issues={issues} onSelectIssue={onSelectIssue} />
      )}
    </div>
  )
}
