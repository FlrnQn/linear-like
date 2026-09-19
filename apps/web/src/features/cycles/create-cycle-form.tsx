import { createCycleSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'

import { ApiError } from '@/lib/api-client'

import { useCreateCycle } from './use-create-cycle'

export function CreateCycleForm({ teamId, onSuccess }: { teamId: string; onSuccess: () => void }) {
  const createCycle = useCreateCycle(teamId)

  const form = useForm({
    defaultValues: { name: '', startDate: '', endDate: '' },
    onSubmit: async ({ value }) => {
      const input = createCycleSchema.parse({
        teamId,
        name: value.name,
        startDate: value.startDate,
        endDate: value.endDate,
      })
      await createCycle.mutateAsync(input, { onSuccess })
      form.reset()
    },
  })

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-muted-foreground text-xs">
              Cycle name
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

      <form.Field name="startDate">
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-muted-foreground text-xs">
              Start
            </label>
            <input
              id={field.name}
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-2 py-1.5 text-sm outline-none"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="endDate">
        {(field) => (
          <div className="flex flex-col gap-1">
            <label htmlFor={field.name} className="text-muted-foreground text-xs">
              End
            </label>
            <input
              id={field.name}
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="border-border bg-background focus:border-accent rounded-lg border px-2 py-1.5 text-sm outline-none"
            />
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) =>
          [
            state.canSubmit,
            state.isSubmitting,
            state.values.name,
            state.values.startDate,
            state.values.endDate,
          ] as const
        }
      >
        {([canSubmit, isSubmitting, name, startDate, endDate]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || !name.trim() || !startDate || !endDate}
            className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            Add
          </button>
        )}
      </form.Subscribe>

      {createCycle.isError && (
        <p className="text-xs text-red-500">
          {createCycle.error instanceof ApiError
            ? createCycle.error.message
            : 'Something went wrong'}
        </p>
      )}
    </form>
  )
}
