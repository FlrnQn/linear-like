import type { IssuePriority } from '@lynx/types'
import { createIssueSchema } from '@lynx/types'
import { cn } from '@lynx/shared'
import { useForm } from '@tanstack/react-form'

import { useCycles } from '@/features/cycles/use-cycles'
import { useLabels } from '@/features/labels/use-labels'
import { useProjects } from '@/features/projects/use-projects'
import { useWorkspaceMembers } from '@/features/workspaces/use-workspace-members'
import { ApiError } from '@/lib/api-client'

import { PrioritySelect } from './priority-select'
import { useCreateIssue } from './use-create-issue'

export function CreateIssueForm({
  teamId,
  workspaceId,
  onSuccess,
}: {
  teamId: string
  workspaceId: string
  onSuccess: () => void
}) {
  const createIssue = useCreateIssue()
  const members = useWorkspaceMembers(workspaceId)
  const labels = useLabels(workspaceId)
  const projects = useProjects(workspaceId)
  const cycles = useCycles(teamId)

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'NO_PRIORITY' as IssuePriority,
      assigneeId: '',
      projectId: '',
      cycleId: '',
      labelIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      const input = createIssueSchema.parse({
        teamId,
        title: value.title,
        description: value.description || undefined,
        priority: value.priority,
        assigneeId: value.assigneeId || undefined,
        projectId: value.projectId || undefined,
        cycleId: value.cycleId || undefined,
        labelIds: value.labelIds,
      })
      // See signup-form.tsx: calling onSuccess off the awaited promise
      // rather than passing it to mutateAsync avoids a StrictMode-only bug
      // where the per-call callback is silently never delivered.
      await createIssue.mutateAsync(input)
      onSuccess()
      form.reset()
    },
  })

  return (
    <form
      className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="title">
        {(field) => (
          <input
            autoFocus
            placeholder="Issue title"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
          />
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <textarea
            placeholder="Description (optional)"
            rows={2}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className="border-border bg-background focus:border-accent resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          />
        )}
      </form.Field>

      <div className="flex flex-wrap items-center gap-2">
        <form.Field name="priority">
          {(field) => <PrioritySelect value={field.state.value} onChange={field.handleChange} />}
        </form.Field>

        <form.Field name="assigneeId">
          {(field) => (
            <select
              aria-label="Assignee"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
            >
              <option value="">Unassigned</option>
              {members.data?.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>

        <form.Field name="projectId">
          {(field) => (
            <select
              aria-label="Project"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
            >
              <option value="">No project</option>
              {projects.data?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>

        <form.Field name="cycleId">
          {(field) => (
            <select
              aria-label="Cycle"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-md border px-2 py-1 text-sm outline-none"
            >
              <option value="">No cycle</option>
              {cycles.data?.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>

        <form.Field name="labelIds">
          {(field) => (
            <div className="flex flex-wrap gap-1.5">
              {labels.data?.map((label) => {
                const active = field.state.value.includes(label.id)
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() =>
                      field.handleChange(
                        active
                          ? field.state.value.filter((id) => id !== label.id)
                          : [...field.state.value, label.id],
                      )
                    }
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs transition-colors',
                      active ? 'border-accent' : 'border-border text-muted-foreground',
                    )}
                    style={
                      active
                        ? { backgroundColor: `${label.color}22`, color: label.color }
                        : undefined
                    }
                  >
                    {label.name}
                  </button>
                )
              })}
            </div>
          )}
        </form.Field>
      </div>

      {createIssue.isError && (
        <p className="text-sm text-red-500">
          {createIssue.error instanceof ApiError
            ? createIssue.error.message
            : 'Something went wrong'}
        </p>
      )}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting, state.values.title] as const}
      >
        {([canSubmit, isSubmitting, title]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || title.trim().length === 0}
            className="bg-accent text-accent-foreground self-start rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create issue'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
