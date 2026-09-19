import { buildApp } from '../src/app'
export async function buildTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}
let counter = 0
function unique(prefix) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}
export async function signupUser(app, overrides) {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/signup',
    payload: {
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `${unique('user')}@example.com`,
      password: overrides?.password ?? 'password123',
    },
  })
  const body = response.json()
  return { accessToken: body.accessToken, userId: body.user.id, email: body.user.email }
}
export async function createWorkspace(app, accessToken, overrides) {
  const response = await app.inject({
    method: 'POST',
    url: '/workspaces',
    headers: { authorization: `Bearer ${accessToken}` },
    payload: {
      name: overrides?.name ?? 'Test Workspace',
      slug: overrides?.slug ?? unique('workspace'),
    },
  })
  return response.json()
}
export async function createTeam(app, accessToken, workspaceId, overrides) {
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
  return response.json()
}
/** A ready-to-use owner + workspace + team, for tests that just need a valid scope. */
export async function setupWorkspaceWithTeam(app) {
  const owner = await signupUser(app)
  const workspace = await createWorkspace(app, owner.accessToken)
  const team = await createTeam(app, owner.accessToken, workspace.id)
  return { owner, workspace, team }
}
//# sourceMappingURL=helpers.js.map
