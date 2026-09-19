import { createCommentSchema } from '@lynx/types'
import { useForm } from '@tanstack/react-form'

import { useCreateComment } from './use-create-comment'

export function CommentForm({ issueId }: { issueId: string }) {
  const createComment = useCreateComment(issueId)

  const form = useForm({
    defaultValues: { body: '' },
    onSubmit: async ({ value }) => {
      const input = createCommentSchema.parse({ issueId, body: value.body })
      await createComment.mutateAsync(input)
      form.reset()
    },
  })

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="body">
        {(field) => (
          <textarea
            placeholder="Add a comment…"
            rows={2}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            className="border-border bg-background focus:border-accent resize-none rounded-lg border px-3 py-2 text-sm outline-none"
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.isSubmitting, state.values.body] as const}>
        {([isSubmitting, body]) => (
          <button
            type="submit"
            disabled={isSubmitting || body.trim().length === 0}
            className="bg-accent text-accent-foreground self-start rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Posting…' : 'Comment'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
