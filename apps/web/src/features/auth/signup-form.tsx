import { signupSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

import { useSignup } from './use-signup'

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const signup = useSignup()
  const id = useId()

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onChange: signupSchema },
    onSubmit: async ({ value }) => {
      // Calling onSuccess directly off the awaited promise, rather than
      // passing it as mutateAsync(vars, {onSuccess}), sidesteps a real
      // StrictMode-only bug: that per-call callback is delivered through
      // the MutationObserver instance current at settle time, which under
      // React 19 StrictMode's double-invoked render can differ from the one
      // this closure was created against — so it silently never fires,
      // even though the mutation (and this promise) succeeds correctly.
      await signup.mutateAsync(value)
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
              {t('auth.name')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="text"
              autoComplete="name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500">{String(field.state.meta.errors[0]?.message)}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${field.name}`} className="text-sm font-medium">
              {t('auth.email')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500">{String(field.state.meta.errors[0]?.message)}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-${field.name}`} className="text-sm font-medium">
              {t('auth.password')}
            </label>
            <input
              id={`${id}-${field.name}`}
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-3 py-2 text-sm outline-none"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-xs text-red-500">{String(field.state.meta.errors[0]?.message)}</p>
            )}
          </div>
        )}
      </form.Field>

      {signup.isError && (
        <p className="text-sm text-red-500">
          {signup.error instanceof ApiError ? signup.error.message : t('common.somethingWentWrong')}
        </p>
      )}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="bg-accent text-accent-foreground mt-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
