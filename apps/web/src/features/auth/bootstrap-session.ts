import { useAuthStore } from '@/stores/auth-store'

import { getCurrentUser, refresh } from './api'

export async function bootstrapSession() {
  try {
    const { accessToken } = await refresh()
    useAuthStore.getState().setAccessToken(accessToken)
    const user = await getCurrentUser()
    useAuthStore.getState().setAuth(accessToken, user)
  } catch {
    useAuthStore.getState().clearAuth()
  }
}
