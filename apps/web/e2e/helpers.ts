import type { APIRequestContext } from '@playwright/test'

export const API_URL = 'http://localhost:4010'

let counter = 0
function unique(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export interface ApiUser {
  name: string
  email: string
  password: string
  userId: string
  accessToken: string
}

// Signup/workspace/team creation via direct API calls — these aren't the
// behavior under test in most specs, so driving them through the UI on every
// spec would just be slow, repetitive setup. Login always goes through the
// real form (see specs) so that flow stays genuinely covered.
export async function signupViaApi(
  request: APIRequestContext,
  overrides?: { name?: string; email?: string; password?: string },
): Promise<ApiUser> {
  const name = overrides?.name ?? 'E2E User'
  const email = overrides?.email ?? `${unique('e2e-user')}@example.com`
  const password = overrides?.password ?? 'password123'

  const response = await request.post(`${API_URL}/auth/signup`, {
    data: { name, email, password },
  })
  const body = (await response.json()) as { user: { id: string }; accessToken: string }
  return { name, email, password, userId: body.user.id, accessToken: body.accessToken }
}

export async function createWorkspaceViaApi(
  request: APIRequestContext,
  accessToken: string,
  overrides?: { name?: string; slug?: string },
) {
  const response = await request.post(`${API_URL}/workspaces`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      name: overrides?.name ?? 'E2E Workspace',
      slug: overrides?.slug ?? unique('e2e-workspace'),
    },
  })
  return response.json() as Promise<{ id: string; name: string; slug: string }>
}

export async function createTeamViaApi(
  request: APIRequestContext,
  accessToken: string,
  workspaceId: string,
  overrides?: { name?: string; key?: string },
) {
  const key = overrides?.key ?? `T${Date.now().toString(36).toUpperCase().slice(-6)}`
  const response = await request.post(`${API_URL}/teams`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { workspaceId, name: overrides?.name ?? 'Engineering', key },
  })
  return response.json() as Promise<{ id: string; name: string; key: string }>
}
