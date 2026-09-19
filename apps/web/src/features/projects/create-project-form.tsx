import { createProjectSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'

import { ApiError } from '@/lib/api-client'

import { useCreateProject } from './use-create-project'

export function CreateProjectForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string
  onSuccess: () => void
}) {
  const createProject = useCreateProject(workspaceId)

  const form = useForm({
    defaultValues: { name: '', color: '#3b82f6' },
    onSubmit: async ({ value }) => {
      const input = createProjectSchema.parse({
        workspaceId,
        name: value.name,
        color: value.color,
      })
      await createProject.mutateAsync(input, { onSuccess })
      form.reset()
    },
  })

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-muted-foreground text-xs">
              Project name
            </label>
            <input
              id={field.name}
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-2 py-1.5 text-sm outline-none"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <input
            type="color"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className="border-border bg-background h-9 w-9 rounded-lg border"
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting, state.values.name] as const}
      >
        {([canSubmit, isSubmitting, name]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || name.trim().length === 0}
            className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            Add
          </button>
        )}
      </form.Subscribe>

      {createProject.isError && (
        <p className="text-xs text-red-500">
          {createProject.error instanceof ApiError
            ? createProject.error.message
            : 'Something went wrong'}
        </p>
      )}
    </form>
  )
}
