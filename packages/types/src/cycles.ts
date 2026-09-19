import { z } from 'zod'

export const createCycleSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
})
export type CreateCycleInput = z.infer<typeof createCycleSchema>

export interface Cycle {
  id: string
  teamId: string
  name: string
  number: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export interface CycleSummary {
  id: string
  name: string
  number: number
}
