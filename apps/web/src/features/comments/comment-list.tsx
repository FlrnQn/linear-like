import type { Comment } from '@lynx/types'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'

export function CommentList({ comments }: { comments: Comment[] }) {
  const { t } = useTranslation()

  if (comments.length === 0) {
    return <EmptyState title={t('comments.empty')} compact />
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <li key={comment.id} className="border-border rounded-lg border p-3 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">{comment.body}</p>
        </li>
      ))}
    </ul>
  )
}
