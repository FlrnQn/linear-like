import type { CreateLabelInput, Label } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function listLabels(workspaceId: string) {
  return apiFetch<Label[]>(`/labels?workspaceId=${workspaceId}`)
}

export function createLabel(input: CreateLabelInput) {
  return apiFetch<Label>('/labels', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
