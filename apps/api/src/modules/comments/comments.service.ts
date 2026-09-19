import type { CreateCommentInput } from '@lynx/types'
import { asc, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { activities, comments } from '../../db/schema'
import { publishWorkspaceEvent } from '../../websocket/events'
import { toPublicComment } from './comments.mapper'

export async function createComment(
  workspaceId: string,
  authorId: string,
  input: CreateCommentInput,
) {
  const commentId = await db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(comments)
      .values({ issueId: input.issueId, authorId, body: input.body })
      .returning()
    if (!comment) throw new Error('Failed to create comment')

    await tx.insert(activities).values({
      workspaceId,
      issueId: input.issueId,
      actorId: authorId,
      type: 'COMMENT_CREATED',
      metadata: { commentId: comment.id },
    })

    return comment.id
  })

  const created = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { author: true },
  })
  if (!created) throw new Error('Failed to load created comment')

  const comment = toPublicComment(created)
  await publishWorkspaceEvent({
    type: 'comment.created',
    workspaceId,
    actorId: authorId,
    comment,
  })

  return comment
}

export async function listCommentsForIssue(issueId: string) {
  const rows = await db.query.comments.findMany({
    where: eq(comments.issueId, issueId),
    with: { author: true },
    orderBy: [asc(comments.createdAt)],
  })
  return rows.map(toPublicComment)
}
