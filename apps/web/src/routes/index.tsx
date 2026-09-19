import { cn } from '@lynx/shared'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { FolderKanban, Users } from 'lucide-react'
import { useEffect } from 'react'

import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { useLogout } from '@/features/auth/use-logout'
import { DashboardPanel } from '@/features/dashboard/dashboard-panel'
import { useWorkspaceStats } from '@/features/dashboard/use-workspace-stats'
import { CreateProjectForm } from '@/features/projects/create-project-form'
import { useProjects } from '@/features/projects/use-projects'
import { useWorkspaceRealtime } from '@/features/realtime/use-workspace-realtime'
import { CreateTeamForm } from '@/features/teams/create-team-form'
import { useTeams } from '@/features/teams/use-teams'
import { CreateWorkspaceForm } from '@/features/workspaces/create-workspace-form'
import { useWorkspaces } from '@/features/workspaces/use-workspaces'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores/workspace-store'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: HomePage,
})

function HomePage() {
  const user = useAuthStore((state) => state.user)
  const workspaces = useWorkspaces()
  const logout = useLogout()
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId ?? undefined)
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId)

  useEffect(() => {
    if (!activeWorkspaceId && workspaces.data && workspaces.data.length > 0) {
      const first = workspaces.data[0]
      if (first) setActiveWorkspaceId(first.id)
    }
  }, [activeWorkspaceId, workspaces.data, setActiveWorkspaceId])

  const teams = useTeams(activeWorkspaceId)
  const projects = useProjects(activeWorkspaceId)
  const stats = useWorkspaceStats(activeWorkspaceId)

  useWorkspaceRealtime(activeWorkspaceId)

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.3em]">
            LYNX
          </p>
          <h1 className="text-2xl font-semibold">Welcome back, {user?.name.split(' ')[0]}</h1>
        </div>
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Sign out
        </button>
      </header>

      {workspaces.isLoading ? (
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ) : workspaces.data && workspaces.data.length === 0 ? (
        <section className="border-border bg-surface rounded-xl border p-6">
          <h2 className="mb-1 text-sm font-medium">Create your first workspace</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            A workspace groups your teams, projects, and issues.
          </p>
          <CreateWorkspaceForm onSuccess={() => undefined} />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {workspaces.data?.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveWorkspaceId(workspace.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  workspace.id === activeWorkspaceId
                    ? 'border-accent text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {workspace.name}
              </button>
            ))}
          </div>

          {stats.data && <DashboardPanel stats={stats.data} />}

          <div className="border-border bg-surface rounded-xl border p-6">
            <h2 className="mb-4 text-sm font-medium">Teams</h2>

            {teams.isLoading ? (
              <div className="mb-4 flex flex-col gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : teams.data && teams.data.length > 0 ? (
              <ul className="mb-4 flex flex-col gap-2">
                {teams.data.map((team) => (
                  <li key={team.id}>
                    <Link
                      to="/teams/$teamId"
                      params={{ teamId: team.id }}
                      className="border-border hover:border-accent flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors"
                    >
                      <span>{team.name}</span>
                      <span className="text-muted-foreground text-xs">{team.key}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Users}
                title="No teams yet"
                description="Create a team to start organizing issues and cycles."
              />
            )}

            {activeWorkspaceId && (
              <CreateTeamForm workspaceId={activeWorkspaceId} onSuccess={() => undefined} />
            )}
          </div>

          <div className="border-border bg-surface rounded-xl border p-6">
            <h2 className="mb-4 text-sm font-medium">Projects</h2>

            {projects.isLoading ? (
              <div className="mb-4 flex flex-col gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : projects.data && projects.data.length > 0 ? (
              <ul className="mb-4 flex flex-col gap-2">
                {projects.data.map((project) => (
                  <li key={project.id}>
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                      className="border-border hover:border-accent flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color ?? '#94a3b8' }}
                      />
                      <span>{project.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create a project to group related issues together."
              />
            )}

            {activeWorkspaceId && (
              <CreateProjectForm workspaceId={activeWorkspaceId} onSuccess={() => undefined} />
            )}
          </div>
        </section>
      )}
    </main>
  )
}
