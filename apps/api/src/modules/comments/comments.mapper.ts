import type { Comment } from '@lynx/types'

import { toPublicUser } from '../users/users.mapper'

interface CommentRow {
  id: string
  issueId: string
  body: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    createdAt: Date
  }
}

export function toPublicComment(row: CommentRow): Comment {
  return {
    id: row.id,
    issueId: row.issueId,
    body: row.body,
    author: toPublicUser(row.author),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
