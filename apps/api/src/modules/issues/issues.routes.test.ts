import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildTestApp, setupWorkspaceWithTeam, signupUser } from '../../../test/helpers'

describe('issues', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates an issue with a computed identifier', async () => {
    const { owner, team } = await setupWorkspaceWithTeam(app)

    const response = await app.inject({
      method: 'POST',
      url: '/issues',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { teamId: team.id, title: 'Fix the login page' },
    })

    expect(response.statusCode).toBe(201)
    const issue = response.json() as { identifier: string; title: string; status: string }
    expect(issue.identifier).toBe(`${team.key}-1`)
    expect(issue.title).toBe('Fix the login page')
    expect(issue.status).toBe('TODO')
  })

  it('edits an issue title and description', async () => {
    const { owner, team } = await setupWorkspaceWithTeam(app)
    const created = await app.inject({
      method: 'POST',
      url: '/issues',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { teamId: team.id, title: 'Original title' },
    })
    const issueId = (created.json() as { id: string }).id

    const response = await app.inject({
      method: 'PATCH',
      url: `/issues/${issueId}`,
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { title: 'Updated title', description: 'Now with details' },
    })

    expect(response.statusCode).toBe(200)
    const issue = response.json() as { title: string; description: string }
    expect(issue.title).toBe('Updated title')
    expect(issue.description).toBe('Now with details')
  })

  it('changes an issue status', async () => {
    const { owner, team } = await setupWorkspaceWithTeam(app)
    const created = await app.inject({
      method: 'POST',
      url: '/issues',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { teamId: team.id, title: 'Ship the feature' },
    })
    const issueId = (created.json() as { id: string }).id

    const response = await app.inject({
      method: 'PATCH',
      url: `/issues/${issueId}`,
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { status: 'IN_PROGRESS' },
    })

    expect(response.statusCode).toBe(200)
    expect((response.json() as { status: string }).status).toBe('IN_PROGRESS')
  })

  it('assigns an issue to a workspace member', async () => {
    const { owner, team } = await setupWorkspaceWithTeam(app)
    const created = await app.inject({
      method: 'POST',
      url: '/issues',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { teamId: team.id, title: 'Needs an owner' },
    })
    const issueId = (created.json() as { id: string }).id

    const response = await app.inject({
      method: 'PATCH',
      url: `/issues/${issueId}`,
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { assigneeId: owner.userId },
    })

    expect(response.statusCode).toBe(200)
    expect((response.json() as { assignee: { id: string } | null }).assignee?.id).toBe(owner.userId)
  })

  it('rejects creating an issue for a team the user is not a member of', async () => {
    const { team } = await setupWorkspaceWithTeam(app)
    const outsider = await signupUser(app)

    const response = await app.inject({
      method: 'POST',
      url: '/issues',
      headers: { authorization: `Bearer ${outsider.accessToken}` },
      payload: { teamId: team.id, title: 'Should not be allowed' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('rejects requests with no access token', async () => {
    const { team } = await setupWorkspaceWithTeam(app)

    const response = await app.inject({
      method: 'POST',
      url: '/issues',
      payload: { teamId: team.id, title: 'No auth header' },
    })

    expect(response.statusCode).toBe(401)
  })
})
