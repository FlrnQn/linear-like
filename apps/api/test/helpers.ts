import type { FastifyInstance } from 'fastify'

import { buildApp } from '../src/app'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = await buildApp()
  await app.ready()
  return app
}

let counter = 0
function unique(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

interface SignedUpUser {
  accessToken: string
  userId: string
  email: string
}

export async function signupUser(
  app: FastifyInstance,
  overrides?: { name?: string; email?: string; password?: string },
): Promise<SignedUpUser> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `${unique('user')}@example.com`,
      password: overrides?.password ?? 'password123',
    },
  })
  const body = response.json() as { user: { id: string; email: string }; accessToken: string }
  return { accessToken: body.accessToken, userId: body.user.id, email: body.user.email }
}

export async function createWorkspace(
  app: FastifyInstance,
  accessToken: string,
  overrides?: { name?: string; slug?: string },
) {
  const response = await app.inject({
    method: 'POST',
    url: '/workspaces',
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      name: overrides?.name ?? 'Test Workspace',
      slug: overrides?.slug ?? unique('workspace'),
    },
  })
  return response.json() as { id: string; name: string; slug: string }
}

export async function createTeam(
  app: FastifyInstance,
  accessToken: string,
  workspaceId: string,
  overrides?: { name?: string; key?: string },
) {
  const response = await app.inject({
    method: 'POST',
    url: '/teams',
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      workspaceId,
      name: overrides?.name ?? 'Engineering',
      key: overrides?.key ?? 'ENG',
    },
  })
  return response.json() as { id: string; workspaceId: string; name: string; key: string }
}

/** A ready-to-use owner + workspace + team, for tests that just need a valid scope. */
export async function setupWorkspaceWithTeam(app: FastifyInstance) {
  const owner = await signupUser(app)
  const workspace = await createWorkspace(app, owner.accessToken)
  const team = await createTeam(app, owner.accessToken, workspace.id)
  return { owner, workspace, team }
}
