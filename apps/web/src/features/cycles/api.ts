import type { CreateCycleInput, Cycle } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listCycles(teamId: string) {
  return apiFetch<Cycle[]>(`/cycles?teamId=${teamId}`)
}

export function createCycle(input: CreateCycleInput) {
  return apiFetch<Cycle>('/cycles', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
