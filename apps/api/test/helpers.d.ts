import type { FastifyInstance } from 'fastify'
export declare function buildTestApp(): Promise<FastifyInstance>
interface SignedUpUser {
  accessToken: string
  userId: string
  email: string
}
export declare function signupUser(
  app: FastifyInstance,
  overrides?: {
    name?: string
    email?: string
    password?: string
  },
): Promise<SignedUpUser>
export declare function createWorkspace(
  app: FastifyInstance,
  accessToken: string,
  overrides?: {
    name?: string
    slug?: string
  },
): Promise<{
  id: string
  name: string
  slug: string
}>
export declare function createTeam(
  app: FastifyInstance,
  accessToken: string,
  workspaceId: string,
  overrides?: {
    name?: string
    key?: string
  },
): Promise<{
  id: string
  workspaceId: string
  name: string
  key: string
}>
/** A ready-to-use owner + workspace + team, for tests that just need a valid scope. */
export declare function setupWorkspaceWithTeam(app: FastifyInstance): Promise<{
  owner: SignedUpUser
  workspace: {
    id: string
    name: string
    slug: string
  }
  team: {
    id: string
    workspaceId: string
    name: string
    key: string
  }
}>
export {}
//# sourceMappingURL=helpers.d.ts.map
