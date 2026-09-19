import { createTeamSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

import { useCreateTeam } from './use-create-team'

export function CreateTeamForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const createTeam = useCreateTeam(workspaceId)
  const id = useId()

  const form = useForm({
    defaultValues: { workspaceId, name: '', key: '' },
    validators: { onChange: createTeamSchema },
    onSubmit: async ({ value }) => {
      // See signup-form.tsx: calling onSuccess off the awaited promise
      // rather than passing it to mutateAsync avoids a StrictMode-only bug
      // where the per-call callback is silently never delivered.
      await createTeam.mutateAsync(value)
      onSuccess()
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
              {t('teams.nameLabel')}
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

      <form.Field name="key">
        {(field) => (
          <div className="flex w-20 flex-col gap-1">
            <label htmlFor={`${id}-${field.name}`} className="text-muted-foreground text-xs">
              {t('teams.keyLabel')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="text"
              placeholder={t('teams.keyPlaceholder')}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-2 py-1.5 text-sm uppercase outline-none"
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            aria-label={t('teams.addAriaLabel')}
            className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {t('common.add')}
          </button>
        )}
      </form.Subscribe>

      {createTeam.isError && (
        <p className="text-xs text-red-500">
          {createTeam.error instanceof ApiError
            ? createTeam.error.message
            : t('common.somethingWentWrong')}
        </p>
      )}
    </form>
  )
}
