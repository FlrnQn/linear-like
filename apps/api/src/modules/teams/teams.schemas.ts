import { z } from 'zod'

export const listTeamsQuerySchema = z.object({
  workspaceId: z.string().uuid(),
})

export const teamIdParamsSchema = z.object({
  id: z.string().uuid(),
})
