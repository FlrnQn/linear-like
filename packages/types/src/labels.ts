import { z } from 'zod'

export const createLabelSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e'),
})
export type CreateLabelInput = z.infer<typeof createLabelSchema>

export interface Label {
  id: string
  workspaceId: string
  name: string
  color: string
  createdAt: string
}
