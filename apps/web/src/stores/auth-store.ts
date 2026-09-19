import type { PublicUser } from '@lynx/types'
import { create } from 'zustand'

export interface AuthState {
  accessToken: string | null
  user: PublicUser | null
  isAuthenticated: boolean
  status: 'pending' | 'ready'
  setAuth: (accessToken: string, user: PublicUser) => void
  setAccessToken: (accessToken: string) => void
  clearAuth: () => void
  finishBootstrap: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  status: 'pending',
  setAuth: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true, status: 'ready' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false, status: 'ready' }),
  finishBootstrap: () => set({ status: 'ready' }),
}))
