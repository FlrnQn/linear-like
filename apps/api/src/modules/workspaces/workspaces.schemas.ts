import { z } from 'zod'

export const workspaceIdParamsSchema = z.object({
  id: z.string().uuid(),
})
