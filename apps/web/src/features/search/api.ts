import type { IssueSearchResult } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function searchIssues(workspaceId: string, q: string) {
  return apiFetch<IssueSearchResult[]>(
    `/search?workspaceId=${workspaceId}&q=${encodeURIComponent(q)}`,
  )
}
