import { z } from 'zod'

import { PROJECT_STATUSES } from './enums'

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(20_000).optional(),
  icon: z.string().trim().max(64).optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e')
    .optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
})
export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(20_000).nullable().optional(),
  icon: z.string().trim().max(64).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #22c55e')
    .nullable()
    .optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetDate: z.coerce.date().nullable().optional(),
})
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  status: (typeof PROJECT_STATUSES)[number]
  startDate: string | null
  targetDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  id: string
  name: string
  color: string | null
  icon: string | null
}
