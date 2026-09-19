import type { Issue, PaginatedIssues } from '@lynx/types'
import type { InfiniteData } from '@tanstack/react-query'

type CachedIssuesData = PaginatedIssues | InfiniteData<PaginatedIssues>

function isInfiniteData(data: CachedIssuesData): data is InfiniteData<PaginatedIssues> {
  return 'pages' in data
}

// The `['issues']` query key prefix matches both the flat Kanban page
// (PaginatedIssues) and the paged List view (InfiniteData<PaginatedIssues>) —
// optimistic updates and realtime patches need to reach into either shape.
export function mapCachedIssues<T>(data: T, map: (issue: Issue) => Issue): T {
  if (!data || typeof data !== 'object') return data
  const typed = data as unknown as CachedIssuesData
  if (isInfiniteData(typed)) {
    return {
      ...typed,
      pages: typed.pages.map((page) => ({ ...page, items: page.items.map(map) })),
    } as T
  }
  if ('items' in typed) {
    return { ...typed, items: typed.items.map(map) } as T
  }
  return data
}
