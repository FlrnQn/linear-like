import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { CreateIssueForm } from '@/features/issues/create-issue-form'
import { IssueDetailDialog } from '@/features/issues/issue-detail-dialog'
import { IssueRow } from '@/features/issues/issue-row'
import { ISSUE_STATUSES, STATUS_LABELS } from '@/features/issues/status-priority'
import { useIssues } from '@/features/issues/use-issues'
import { useTeam } from '@/features/teams/use-team'
import { cn } from '@lynx/shared'

export const Route = createFileRoute('/teams/$teamId')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: TeamIssuesPage,
})

type StatusFilter = (typeof ISSUE_STATUSES)[number] | 'ALL'

function TeamIssuesPage() {
  const { teamId } = Route.useParams()
  const team = useTeam(teamId)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const issues = useIssues({
    teamId,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  if (!team.data) {
    return <p className="text-muted-foreground p-16 text-sm">Loading team…</p>
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
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
