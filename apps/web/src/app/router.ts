import { createRouter } from '@tanstack/react-router'

import type { AuthState } from '@/stores/auth-store'

import { routeTree } from '../routeTree.gen'

export interface RouterContext {
  auth: AuthState
}

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined as unknown as AuthState,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
