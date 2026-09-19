import { z } from 'zod'

export const createTeamSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Key must contain only uppercase letters and numbers'),
  description: z.string().trim().max(2000).optional(),
})
export type CreateTeamInput = z.infer<typeof createTeamSchema>

export interface Team {
  id: string
  workspaceId: string
  name: string
  key: string
  description: string | null
  issueCount: number
  createdAt: string
  updatedAt: string
}
