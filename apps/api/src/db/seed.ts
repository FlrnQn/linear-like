import { faker } from '@faker-js/faker'
import { eq, sql } from 'drizzle-orm'

import { db } from './client'
import { pgPool } from './postgres'
import {
  activities,
  comments,
  cycles,
  issueLabels,
  issues,
  labels,
  projects,
  teamMembers,
  teams,
  users,
  workspaceMembers,
  workspaces,
} from './schema'

const ISSUE_COUNT = Number(process.env.SEED_ISSUE_COUNT ?? 120)
const CHUNK_SIZE = 500

const LABELS = [
  { name: 'Bug', color: '#ef4444' },
  { name: 'Feature', color: '#22c55e' },
  { name: 'Improvement', color: '#3b82f6' },
  { name: 'Frontend', color: '#a855f7' },
  { name: 'Backend', color: '#f59e0b' },
  { name: 'Design', color: '#ec4899' },
  { name: 'Performance', color: '#06b6d4' },
  { name: 'Documentation', color: '#64748b' },
]

const TEAMS = [
  { name: 'Engineering', key: 'ENG' },
  { name: 'Design', key: 'DES' },
  { name: 'Product', key: 'PRO' },
]

const TITLE_VERBS = ['Fix', 'Improve', 'Add', 'Refactor', 'Investigate', 'Update', 'Remove']
const TITLE_SUBJECTS = [
  'authentication flow',
  'onboarding experience',
  'dashboard performance',
  'issue search',
  'command palette',
  'notification system',
  'API rate limiting',
  'drag and drop ordering',
  'dark mode contrast',
  'keyboard navigation',
  'webhook delivery',
  'caching layer',
  'error handling',
  'form validation',
  'real-time sync',
]

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function pastDate(daysAgo: number) {
  return faker.date.recent({ days: daysAgo })
}

function futureDate(daysAhead: number) {
  return faker.date.soon({ days: daysAhead })
}

// Postgres's now() is stable for the whole seed transaction, so every row
// would otherwise share one identical created_at — which breaks keyset
// pagination (nothing to page on) and makes an "activity over time" chart
// show a single spike. Each issue gets its own point in the last 60 days;
// activity/comment timestamps are then anchored to *their* issue's date so
// history stays causally ordered (nothing happens before the issue exists).
function afterDate(from: Date) {
  const now = new Date()
  return from >= now ? now : faker.date.between({ from, to: now })
}

async function seed() {
  faker.seed(1234)

  await db.execute(sql`
    TRUNCATE TABLE
      activities, comments, issue_labels, issues, cycles, projects,
      team_members, teams, workspace_members, workspaces, labels, users
    CASCADE
  `)

  await db.transaction(async (tx) => {
    const insertedUsers = await tx
      .insert(users)
      .values(
        Array.from({ length: 8 }, () => {
          const name = faker.person.fullName()
          return {
            name,
            email: faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase(),
            avatarUrl: faker.image.avatarGitHub(),
          }
        }),
      )
      .returning({ id: users.id, name: users.name })

    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: 'Lynx Demo', slug: 'lynx-demo' })
      .returning({ id: workspaces.id })
    if (!workspace) throw new Error('Failed to seed workspace')

    const roles = [
      'OWNER',
      'ADMIN',
      'MEMBER',
      'MEMBER',
      'MEMBER',
      'MEMBER',
      'MEMBER',
      'GUEST',
    ] as const
    await tx.insert(workspaceMembers).values(
      insertedUsers.map((user, i) => ({
        workspaceId: workspace.id,
        userId: user.id,
        role: roles[i] ?? 'MEMBER',
      })),
    )

    const insertedTeams = await tx
      .insert(teams)
      .values(TEAMS.map((team) => ({ ...team, workspaceId: workspace.id })))
      .returning({ id: teams.id, key: teams.key })

    const teamMemberPairs = new Map<string, Set<string>>()
    for (const team of insertedTeams) {
      const memberCount = faker.number.int({ min: 4, max: insertedUsers.length })
      const members = faker.helpers.arrayElements(insertedUsers, memberCount)
      teamMemberPairs.set(team.id, new Set(members.map((m) => m.id)))
    }
    await tx
      .insert(teamMembers)
      .values(
        insertedTeams.flatMap((team) =>
          [...(teamMemberPairs.get(team.id) ?? [])].map((userId) => ({ teamId: team.id, userId })),
        ),
      )

    const insertedLabels = await tx
      .insert(labels)
      .values(LABELS.map((label) => ({ ...label, workspaceId: workspace.id })))
      .returning({ id: labels.id })

    const insertedProjects = await tx
      .insert(projects)
      .values([
        {
          workspaceId: workspace.id,
          name: 'Authentication Overhaul',
          description: 'Modernize sign-in, sessions, and permissions.',
          status: 'IN_PROGRESS' as const,
          startDate: pastDate(30),
          targetDate: futureDate(45),
        },
        {
          workspaceId: workspace.id,
          name: 'Public API',
          description: 'Expose a versioned REST API for third-party integrations.',
          status: 'PLANNED' as const,
          startDate: futureDate(14),
          targetDate: futureDate(90),
        },
        {
          workspaceId: workspace.id,
          name: 'Design System Refresh',
          description: 'Unify components, tokens, and motion patterns.',
          status: 'COMPLETED' as const,
          startDate: pastDate(90),
          targetDate: pastDate(10),
        },
      ])
      .returning({ id: projects.id })

    const insertedCycles = await tx
      .insert(cycles)
      .values(
        insertedTeams.flatMap((team) => [
          {
            teamId: team.id,
            name: `Cycle 1`,
            number: 1,
            startDate: pastDate(28),
            endDate: pastDate(14),
          },
          {
            teamId: team.id,
            name: `Cycle 2`,
            number: 2,
            startDate: pastDate(13),
            endDate: futureDate(1),
          },
        ]),
      )
      .returning({ id: cycles.id, teamId: cycles.teamId, number: cycles.number })

    const cyclesByTeam = new Map<string, typeof insertedCycles>()
    for (const c of insertedCycles) {
      cyclesByTeam.set(c.teamId, [...(cyclesByTeam.get(c.teamId) ?? []), c])
    }

    const teamIssueCounters = new Map(insertedTeams.map((t) => [t.id, 0]))
    const issueRows = Array.from({ length: ISSUE_COUNT }, (_, i) => {
      const team = insertedTeams[i % insertedTeams.length]
      if (!team) throw new Error('No teams to assign issues to')

      const nextNumber = (teamIssueCounters.get(team.id) ?? 0) + 1
      teamIssueCounters.set(team.id, nextNumber)

      const teamMemberIds = [...(teamMemberPairs.get(team.id) ?? [])]
      const creatorId = faker.helpers.arrayElement(teamMemberIds)
      const hasAssignee = faker.datatype.boolean({ probability: 0.7 })
      const status = faker.helpers.weightedArrayElement([
        { weight: 10, value: 'BACKLOG' as const },
        { weight: 30, value: 'TODO' as const },
        { weight: 25, value: 'IN_PROGRESS' as const },
        { weight: 10, value: 'IN_REVIEW' as const },
        { weight: 20, value: 'DONE' as const },
        { weight: 5, value: 'CANCELED' as const },
      ])
      const teamCycles = cyclesByTeam.get(team.id) ?? []
      const hasCycle = faker.datatype.boolean({ probability: 0.5 })
      const cycle =
        hasCycle && teamCycles.length > 0
          ? status === 'DONE' || status === 'CANCELED'
            ? teamCycles[0]
            : teamCycles[teamCycles.length - 1]
          : undefined

      const createdAt = pastDate(60)
      const isPastTodo = status !== 'BACKLOG' && status !== 'TODO'

      return {
        teamId: team.id,
        number: nextNumber,
        createdAt,
        updatedAt: isPastTodo ? afterDate(createdAt) : createdAt,
        title: `${faker.helpers.arrayElement(TITLE_VERBS)} ${faker.helpers.arrayElement(TITLE_SUBJECTS)}`,
        description: faker.datatype.boolean({ probability: 0.8 })
          ? faker.lorem.paragraphs({ min: 1, max: 3 })
          : null,
        status,
        priority: faker.helpers.weightedArrayElement([
          { weight: 20, value: 'NO_PRIORITY' as const },
          { weight: 20, value: 'LOW' as const },
          { weight: 30, value: 'MEDIUM' as const },
          { weight: 20, value: 'HIGH' as const },
          { weight: 10, value: 'URGENT' as const },
        ]),
        assigneeId: hasAssignee ? faker.helpers.arrayElement(teamMemberIds) : null,
        creatorId,
        projectId: faker.datatype.boolean({ probability: 0.6 })
          ? faker.helpers.arrayElement(insertedProjects).id
          : null,
        cycleId: cycle?.id ?? null,
        estimate: faker.datatype.boolean({ probability: 0.6 })
          ? faker.helpers.arrayElement([1, 2, 3, 5, 8])
          : null,
        dueDate: faker.datatype.boolean({ probability: 0.4 }) ? futureDate(30) : null,
        sortOrder: i * 10,
      }
    })

    const insertedIssues: {
      id: string
      status: string
      creatorId: string
      assigneeId: string | null
      title: string
      createdAt: Date
    }[] = []
    for (const batch of chunk(issueRows, CHUNK_SIZE)) {
      const returned = await tx.insert(issues).values(batch).returning({
        id: issues.id,
        status: issues.status,
        creatorId: issues.creatorId,
        assigneeId: issues.assigneeId,
        title: issues.title,
        createdAt: issues.createdAt,
      })
      insertedIssues.push(...returned)
    }

    const issueLabelRows = insertedIssues.flatMap((issue) => {
      const labelCount = faker.number.int({ min: 0, max: 3 })
      return faker.helpers
        .arrayElements(insertedLabels, labelCount)
        .map((label) => ({ issueId: issue.id, labelId: label.id }))
    })
    for (const batch of chunk(issueLabelRows, CHUNK_SIZE)) {
      if (batch.length > 0) await tx.insert(issueLabels).values(batch)
    }

    const allUserIds = insertedUsers.map((u) => u.id)
    const commentRows = insertedIssues.flatMap((issue) => {
      const commentCount = faker.number.int({ min: 0, max: 3 })
      return Array.from({ length: commentCount }, () => ({
        issueId: issue.id,
        authorId: faker.helpers.arrayElement(allUserIds),
        body: faker.lorem.sentences({ min: 1, max: 3 }),
        createdAt: afterDate(issue.createdAt),
      }))
    })
    for (const batch of chunk(commentRows, CHUNK_SIZE)) {
      if (batch.length > 0) await tx.insert(comments).values(batch)
    }

    const activityRows = insertedIssues.flatMap((issue) => {
      const rows: {
        workspaceId: string
        issueId: string
        actorId: string
        type: 'ISSUE_CREATED' | 'ISSUE_STATUS_CHANGED' | 'ISSUE_ASSIGNED'
        metadata: Record<string, unknown>
        createdAt: Date
      }[] = [
        {
          workspaceId: workspace.id,
          issueId: issue.id,
          actorId: issue.creatorId,
          type: 'ISSUE_CREATED',
          metadata: { title: issue.title },
          createdAt: issue.createdAt,
        },
      ]
      if (issue.status !== 'BACKLOG' && issue.status !== 'TODO') {
        rows.push({
          workspaceId: workspace.id,
          issueId: issue.id,
          actorId: issue.assigneeId ?? issue.creatorId,
          type: 'ISSUE_STATUS_CHANGED' as const,
          metadata: { from: 'TODO', to: issue.status },
          createdAt: afterDate(issue.createdAt),
        })
      }
      if (issue.assigneeId) {
        rows.push({
          workspaceId: workspace.id,
          issueId: issue.id,
          actorId: issue.creatorId,
          type: 'ISSUE_ASSIGNED' as const,
          metadata: { assigneeId: issue.assigneeId },
          createdAt: afterDate(issue.createdAt),
        })
      }
      return rows
    })
    for (const batch of chunk(activityRows, CHUNK_SIZE)) {
      if (batch.length > 0) await tx.insert(activities).values(batch)
    }

    for (const team of insertedTeams) {
      await tx
        .update(teams)
        .set({ issueCount: teamIssueCounters.get(team.id) ?? 0 })
        .where(eq(teams.id, team.id))
    }

    console.log(
      `Seeded: ${insertedUsers.length} users, 1 workspace, ${insertedTeams.length} teams, ` +
        `${insertedProjects.length} projects, ${insertedCycles.length} cycles, ` +
        `${insertedIssues.length} issues, ${issueLabelRows.length} issue labels, ` +
        `${commentRows.length} comments, ${activityRows.length} activities.`,
    )
  })

  await pgPool.end()
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
