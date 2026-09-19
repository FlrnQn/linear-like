import { createProjectSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

import { useCreateProject } from './use-create-project'

export function CreateProjectForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const createProject = useCreateProject(workspaceId)
  const id = useId()

  const form = useForm({
    defaultValues: { name: '', color: '#3b82f6' },
    onSubmit: async ({ value }) => {
      const input = createProjectSchema.parse({
        workspaceId,
        name: value.name,
        color: value.color,
      })
      // See signup-form.tsx: calling onSuccess off the awaited promise
      // rather than passing it to mutateAsync avoids a StrictMode-only bug
      // where the per-call callback is silently never delivered.
      await createProject.mutateAsync(input)
      onSuccess()
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
            <label htmlFor={`${id}-${field.name}`} className="text-muted-foreground text-xs">
              {t('projects.nameLabel')}
            </label>
            <input
              id={`${id}-${field.name}`}
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
            aria-label={t('projects.addAriaLabel')}
            className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {t('common.add')}
          </button>
        )}
      </form.Subscribe>

      {createProject.isError && (
        <p className="text-xs text-red-500">
          {createProject.error instanceof ApiError
            ? createProject.error.message
            : t('common.somethingWentWrong')}
        </p>
      )}
    </form>
  )
}
