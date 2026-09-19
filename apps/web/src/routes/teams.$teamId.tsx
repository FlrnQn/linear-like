import { cn } from '@lynx/shared'
import { ISSUE_STATUSES } from '@lynx/types'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { CreateCycleForm } from '@/features/cycles/create-cycle-form'
import { useCycles } from '@/features/cycles/use-cycles'
import { CreateIssueForm } from '@/features/issues/create-issue-form'
import { IssueDetailDialog } from '@/features/issues/issue-detail-dialog'
import { IssueRow } from '@/features/issues/issue-row'
import { KanbanBoard } from '@/features/issues/kanban-board'
import { STATUS_LABELS } from '@/features/issues/status-priority'
import { useIssues } from '@/features/issues/use-issues'
import { useTeam } from '@/features/teams/use-team'

export const Route = createFileRoute('/teams/$teamId')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: TeamIssuesPage,
})

type StatusFilter = (typeof ISSUE_STATUSES)[number] | 'ALL'
type ViewMode = 'list' | 'kanban'

function TeamIssuesPage() {
  const { teamId } = Route.useParams()
  const team = useTeam(teamId)
  const cycles = useCycles(teamId)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [view, setView] = useState<ViewMode>('list')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateCycle, setShowCreateCycle] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const issues = useIssues({
    teamId,
    status: view === 'list' && statusFilter !== 'ALL' ? statusFilter : undefined,
    cycleId: cycleFilter || undefined,
  })

  if (!team.data) {
    return <p className="text-muted-foreground p-16 text-sm">Loading team…</p>
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-muted-foreground hover:text-foreground text-xs">
            ← Back
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{team.data.name}</h1>
          <p className="text-muted-foreground text-sm">{team.data.key}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium"
        >
          {showCreateForm ? 'Cancel' : 'New issue'}
        </button>
      </header>

      {showCreateForm && (
        <CreateIssueForm
          teamId={teamId}
          workspaceId={team.data.workspaceId}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      <section className="border-border bg-surface rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Cycles</h2>
          <button
            type="button"
            onClick={() => setShowCreateCycle((v) => !v)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {showCreateCycle ? 'Cancel' : '+ New cycle'}
          </button>
        </div>
        {showCreateCycle && (
          <div className="mb-3">
            <CreateCycleForm teamId={teamId} onSuccess={() => setShowCreateCycle(false)} />
          </div>
        )}
        {cycles.data && cycles.data.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {cycles.data.map((cycle) => (
              <span
                key={cycle.id}
                className="border-border rounded-full border px-2 py-0.5 text-xs"
              >
                {cycle.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No cycles yet.</p>
        )}
      </section>

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

        <select
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
          className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
        >
          <option value="">All cycles</option>
          {cycles.data?.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name}
            </option>
          ))}
        </select>

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
          {issues.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading issues…</p>
          ) : issues.data && issues.data.length > 0 ? (
            issues.data.map((issue) => (
              <IssueRow key={issue.id} issue={issue} onClick={() => setSelectedIssueId(issue.id)} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No issues yet.</p>
          )}
        </div>
      ) : issues.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading issues…</p>
      ) : (
        <KanbanBoard issues={issues.data ?? []} onSelectIssue={setSelectedIssueId} />
      )}

      {selectedIssueId && (
        <IssueDetailDialog
          issueId={selectedIssueId}
          workspaceId={team.data.workspaceId}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
    </main>
  )
}
