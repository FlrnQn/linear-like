import { z } from 'zod'

export const listTeamsQuerySchema = z.object({
  workspaceId: z.string().uuid(),
})
