import type { IssueStatus } from '@lynx/types'
import { ISSUE_STATUSES } from '@lynx/types'
import { cn } from '@lynx/shared'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'

import type { ListIssuesParams } from './api'
import { IssueRow } from './issue-row'
import { KanbanBoard } from './kanban-board'
import { STATUS_LABELS } from './status-priority'
import { useInfiniteIssues, useIssues } from './use-issues'

type StatusFilter = IssueStatus | 'ALL'
type ViewMode = 'list' | 'kanban'

// Fixed row height lets the virtualizer skip measuring the DOM — every IssueRow
// renders at the same height (py-2 + text-sm + border), so an estimate is exact.
const ROW_HEIGHT_PX = 45
const LIST_VIEWPORT_HEIGHT_PX = 560

export function IssueBoard({
  filters,
  onSelectIssue,
  extraFilters,
}: {
  filters: ListIssuesParams
  onSelectIssue: (issueId: string) => void
  extraFilters?: ReactNode
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [view, setView] = useState<ViewMode>('list')

  const listFilters = useMemo(
    () => ({ ...filters, status: statusFilter === 'ALL' ? undefined : statusFilter }),
    [filters, statusFilter],
  )

  const infiniteIssues = useInfiniteIssues(listFilters, { enabled: view === 'list' })
  const kanbanIssues = useIssues(filters, { enabled: view === 'kanban' })

  const listRows = useMemo(
    () => infiniteIssues.data?.pages.flatMap((page) => page.items) ?? [],
    [infiniteIssues.data],
  )

  const parentRef = useRef<HTMLDivElement>(null)
  const hasNextPage = infiniteIssues.hasNextPage
  const isFetchingNextPage = infiniteIssues.isFetchingNextPage
  const fetchNextPage = infiniteIssues.fetchNextPage

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? listRows.length + 1 : listRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 8,
  })
  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return
    if (lastItem.index >= listRows.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [virtualItems, listRows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

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
        infiniteIssues.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : listRows.length > 0 ? (
          <div
            ref={parentRef}
            className="overflow-y-auto"
            style={{ height: LIST_VIEWPORT_HEIGHT_PX }}
          >
            <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
              {virtualItems.map((virtualRow) => {
                const issue = listRows[virtualRow.index]
                return (
                  <div
                    key={virtualRow.key}
                    className="absolute left-0 top-0 w-full py-1"
                    style={{
                      height: virtualRow.size,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {issue ? (
                      <IssueRow issue={issue} onClick={() => onSelectIssue(issue.id)} />
                    ) : (
                      <Skeleton className="h-9 w-full" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            scene
            title="No issues yet"
            description="Create the first issue to get this team moving."
          />
        )
      ) : kanbanIssues.isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex w-64 shrink-0 flex-col gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {kanbanIssues.data?.nextCursor && (
            <p className="text-muted-foreground text-xs">
              Showing the first {kanbanIssues.data.items.length} issues — narrow with a cycle or
              team filter to see the rest.
            </p>
          )}
          <KanbanBoard issues={kanbanIssues.data?.items ?? []} onSelectIssue={onSelectIssue} />
        </>
      )}
    </div>
  )
}
