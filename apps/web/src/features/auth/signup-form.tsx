import { signupSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'

import { ApiError } from '@/lib/api-client'

import { useSignup } from './use-signup'

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const signup = useSignup()

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onChange: signupSchema },
    onSubmit: async ({ value }) => {
      await signup.mutateAsync(value, { onSuccess })
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
            <label htmlFor={field.name} className="text-sm font-medium">
              Name
            </label>
            <input
              id={field.name}
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
            <label htmlFor={field.name} className="text-sm font-medium">
              Email
            </label>
            <input
              id={field.name}
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
            <label htmlFor={field.name} className="text-sm font-medium">
              Password
            </label>
            <input
              id={field.name}
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
          {signup.error instanceof ApiError ? signup.error.message : 'Something went wrong'}
        </p>
      )}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="bg-accent text-accent-foreground mt-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
