import { z } from 'zod'

import type { PublicUser } from './auth'

export const createCommentSchema = z.object({
  issueId: z.string().uuid(),
  body: z.string().trim().min(1).max(10_000),
})
export type CreateCommentInput = z.infer<typeof createCommentSchema>

export interface Comment {
  id: string
  issueId: string
  body: string
  author: PublicUser
  createdAt: string
  updatedAt: string
}
