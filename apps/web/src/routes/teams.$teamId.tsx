import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { CreateCycleForm } from '@/features/cycles/create-cycle-form'
import { useCycles } from '@/features/cycles/use-cycles'
import { CreateIssueForm } from '@/features/issues/create-issue-form'
import { IssueBoard } from '@/features/issues/issue-board'
import { IssueDetailDialog } from '@/features/issues/issue-detail-dialog'
import { useWorkspaceRealtime } from '@/features/realtime/use-workspace-realtime'
import { useTeam } from '@/features/teams/use-team'
import { useWorkspaceStore } from '@/stores/workspace-store'

const teamSearchSchema = z.object({
  issue: z.string().uuid().optional(),
})

export const Route = createFileRoute('/teams/$teamId')({
  validateSearch: teamSearchSchema,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: TeamIssuesPage,
})

function TeamIssuesPage() {
  const { teamId } = Route.useParams()
  const { issue: issueFromSearch } = Route.useSearch()
  const team = useTeam(teamId)
  const cycles = useCycles(teamId)
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId)
  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateCycle, setShowCreateCycle] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(issueFromSearch ?? null)

  useWorkspaceRealtime(team.data?.workspaceId)

  useEffect(() => {
    if (team.data) setActiveWorkspaceId(team.data.workspaceId)
  }, [team.data, setActiveWorkspaceId])

  if (!team.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    )
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
          <EmptyState title="No cycles yet." compact />
        )}
      </section>

      <IssueBoard
        filters={{ teamId, cycleId: cycleFilter || undefined }}
        onSelectIssue={setSelectedIssueId}
        extraFilters={
          <select
            aria-label="Filter by cycle"
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
        }
      />

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
