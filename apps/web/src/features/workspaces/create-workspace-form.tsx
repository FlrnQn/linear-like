import { createWorkspaceSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'
import { useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

import { useCreateWorkspace } from './use-create-workspace'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CreateWorkspaceForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const createWorkspace = useCreateWorkspace()
  const slugTouched = useRef(false)
  const id = useId()

  const form = useForm({
    defaultValues: { name: '', slug: '' },
    validators: { onChange: createWorkspaceSchema },
    onSubmit: async ({ value }) => {
      // See signup-form.tsx: calling onSuccess off the awaited promise
      // rather than passing it to mutateAsync avoids a StrictMode-only bug
      // where the per-call callback is silently never delivered.
      await createWorkspace.mutateAsync(value)
      onSuccess()
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${field.name}`} className="text-sm font-medium">
              {t('workspaces.nameLabel')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                field.handleChange(e.target.value)
                if (!slugTouched.current) {
                  form.setFieldValue('slug', slugify(e.target.value))
                }
              }}
              className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500">{String(field.state.meta.errors[0]?.message)}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="slug">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${field.name}`} className="text-sm font-medium">
              {t('workspaces.slugLabel')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => {
                slugTouched.current = true
                field.handleChange(e.target.value)
              }}
              className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500">{String(field.state.meta.errors[0]?.message)}</p>
            )}
          </div>
        )}
      </form.Field>

      {createWorkspace.isError && (
        <p className="text-sm text-red-500">
          {createWorkspace.error instanceof ApiError
            ? createWorkspace.error.message
            : t('common.somethingWentWrong')}
        </p>
      )}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="bg-accent text-accent-foreground mt-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? t('common.creating') : t('workspaces.submit')}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
