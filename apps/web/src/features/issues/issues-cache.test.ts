import type { Issue, PaginatedIssues, PublicUser } from '@lynx/types'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { mapCachedIssues } from './issues-cache'

const creator: PublicUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function makeIssue(overrides: Partial<Issue>): Issue {
  return {
    id: 'issue-1',
    teamId: 'team-1',
    identifier: 'ENG-1',
    number: 1,
    title: 'Original title',
    description: null,
    status: 'TODO',
    priority: 'NO_PRIORITY',
    estimate: null,
    dueDate: null,
    sortOrder: 0,
    projectId: null,
    cycleId: null,
    assignee: null,
    creator,
    labels: [],
    project: null,
    cycle: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const bumpTitle = (issue: Issue): Issue =>
  issue.id === 'issue-1' ? { ...issue, title: 'Updated title' } : issue

describe('mapCachedIssues', () => {
  it('maps items in a flat PaginatedIssues page (Kanban shape)', () => {
    const data: PaginatedIssues = {
      items: [makeIssue({ id: 'issue-1' }), makeIssue({ id: 'issue-2', title: 'Untouched' })],
      nextCursor: null,
    }

    const result = mapCachedIssues(data, bumpTitle)

    expect(result.items[0]?.title).toBe('Updated title')
    expect(result.items[1]?.title).toBe('Untouched')
    expect(result.nextCursor).toBeNull()
  })

  it('maps items across every page of InfiniteData (virtualized List shape)', () => {
    const data: InfiniteData<PaginatedIssues> = {
      pages: [
        { items: [makeIssue({ id: 'issue-1' })], nextCursor: 'cursor-2' },
        { items: [makeIssue({ id: 'issue-2', title: 'Untouched' })], nextCursor: null },
      ],
      pageParams: [undefined, 'cursor-2'],
    }

    const result = mapCachedIssues(data, bumpTitle)

    expect(result.pages[0]?.items[0]?.title).toBe('Updated title')
    expect(result.pages[1]?.items[0]?.title).toBe('Untouched')
  })

  it('returns non-issue-cache data untouched', () => {
    expect(mapCachedIssues(undefined, bumpTitle)).toBeUndefined()
    expect(mapCachedIssues(null, bumpTitle)).toBeNull()
    const other = { some: 'other-shape' }
    expect(mapCachedIssues(other, bumpTitle)).toBe(other)
  })
})
