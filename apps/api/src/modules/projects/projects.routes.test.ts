import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildTestApp, createWorkspace, signupUser } from '../../../test/helpers'

describe('projects', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates a project in a workspace', async () => {
    const owner = await signupUser(app)
    const workspace = await createWorkspace(app, owner.accessToken)

    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: { workspaceId: workspace.id, name: 'Mobile Redesign' },
    })

    expect(response.statusCode).toBe(201)
    const project = response.json() as { name: string; workspaceId: string; status: string }
    expect(project.name).toBe('Mobile Redesign')
    expect(project.workspaceId).toBe(workspace.id)
  })

  it('rejects project creation from a non-member', async () => {
    const owner = await signupUser(app)
    const workspace = await createWorkspace(app, owner.accessToken)
    const outsider = await signupUser(app)

    const response = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: { authorization: `Bearer ${outsider.accessToken}` },
      payload: { workspaceId: workspace.id, name: 'Should not be allowed' },
    })

    expect(response.statusCode).toBe(403)
  })
})
