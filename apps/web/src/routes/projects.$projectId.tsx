import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { IssueBoard } from '@/features/issues/issue-board'
import { IssueDetailDialog } from '@/features/issues/issue-detail-dialog'
import { useIssues } from '@/features/issues/use-issues'
import { useProject } from '@/features/projects/use-project'
import { useWorkspaceRealtime } from '@/features/realtime/use-workspace-realtime'
import { useWorkspaceStore } from '@/stores/workspace-store'

const projectSearchSchema = z.object({
  issue: z.string().uuid().optional(),
})

export const Route = createFileRoute('/projects/$projectId')({
  validateSearch: projectSearchSchema,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: ProjectIssuesPage,
})

function ProjectIssuesPage() {
  const { projectId } = Route.useParams()
  const { issue: issueFromSearch } = Route.useSearch()
  const project = useProject(projectId)
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(issueFromSearch ?? null)

  const issues = useIssues({ projectId })

  useWorkspaceRealtime(project.data?.workspaceId)

  useEffect(() => {
    if (project.data) setActiveWorkspaceId(project.data.workspaceId)
  }, [project.data, setActiveWorkspaceId])

  if (!project.data) {
    return <p className="text-muted-foreground p-16 text-sm">Loading project…</p>
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-16">
      <header>
        <Link to="/" className="text-muted-foreground hover:text-foreground text-xs">
          ← Back
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: project.data.color ?? '#94a3b8' }}
          />
          <h1 className="text-2xl font-semibold">{project.data.name}</h1>
        </div>
        {project.data.description && (
          <p className="text-muted-foreground mt-1 text-sm">{project.data.description}</p>
        )}
      </header>

      <IssueBoard
        issues={issues.data ?? []}
        isLoading={issues.isLoading}
        onSelectIssue={setSelectedIssueId}
      />

      {selectedIssueId && (
        <IssueDetailDialog
          issueId={selectedIssueId}
          workspaceId={project.data.workspaceId}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
    </main>
  )
}
