import { cn } from '@lynx/shared'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { useLogout } from '@/features/auth/use-logout'
import { CreateProjectForm } from '@/features/projects/create-project-form'
import { useProjects } from '@/features/projects/use-projects'
import { CreateTeamForm } from '@/features/teams/create-team-form'
import { useTeams } from '@/features/teams/use-teams'
import { CreateWorkspaceForm } from '@/features/workspaces/create-workspace-form'
import { useWorkspaces } from '@/features/workspaces/use-workspaces'
import { useAuthStore } from '@/stores/auth-store'

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
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>()

  const activeWorkspaceId = selectedWorkspaceId ?? workspaces.data?.[0]?.id
  const teams = useTeams(activeWorkspaceId)
  const projects = useProjects(activeWorkspaceId)

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
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
        <p className="text-muted-foreground text-sm">Loading workspaces…</p>
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
                onClick={() => setSelectedWorkspaceId(workspace.id)}
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

          <div className="border-border bg-surface rounded-xl border p-6">
            <h2 className="mb-4 text-sm font-medium">Teams</h2>

            {teams.isLoading ? (
              <p className="text-muted-foreground mb-4 text-sm">Loading teams…</p>
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
              <p className="text-muted-foreground mb-4 text-sm">No teams yet.</p>
            )}

            {activeWorkspaceId && (
              <CreateTeamForm workspaceId={activeWorkspaceId} onSuccess={() => undefined} />
            )}
          </div>

          <div className="border-border bg-surface rounded-xl border p-6">
            <h2 className="mb-4 text-sm font-medium">Projects</h2>

            {projects.isLoading ? (
              <p className="text-muted-foreground mb-4 text-sm">Loading projects…</p>
            ) : projects.data && projects.data.length > 0 ? (
              <ul className="mb-4 flex flex-col gap-2">
                {projects.data.map((project) => (
                  <li
                    key={project.id}
                    className="border-border flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color ?? '#94a3b8' }}
                    />
                    <span>{project.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-4 text-sm">No projects yet.</p>
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
