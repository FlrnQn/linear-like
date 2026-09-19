import { z } from 'zod'

import type { PublicUser } from './auth'
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from './enums'
import type { Label } from './labels'

export const createIssueSchema = z.object({
  teamId: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(20_000).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  assigneeId: z.string().uuid().optional(),
  estimate: z.number().int().min(0).max(100).optional(),
  dueDate: z.coerce.date().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
})
export type CreateIssueInput = z.infer<typeof createIssueSchema>

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  status: z.enum(ISSUE_STATUSES).optional(),
  priority: z.enum(ISSUE_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
})
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>

export interface Issue {
  id: string
  teamId: string
  identifier: string
  number: number
  title: string
  description: string | null
  status: (typeof ISSUE_STATUSES)[number]
  priority: (typeof ISSUE_PRIORITIES)[number]
  estimate: number | null
  dueDate: string | null
  sortOrder: number
  projectId: string | null
  cycleId: string | null
  assignee: PublicUser | null
  creator: PublicUser
  labels: Label[]
  createdAt: string
  updatedAt: string
}
