import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

export interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}
