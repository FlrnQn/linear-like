import type { AuthResponse, LoginInput, PublicUser, SignupInput } from '@lynx/types'

import { apiFetch } from '@/lib/api-client'

export function signup(input: SignupInput) {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function login(input: LoginInput) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout() {
  return apiFetch<void>('/auth/logout', { method: 'POST' })
}

export function refresh() {
  return apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
}

export function getCurrentUser() {
  return apiFetch<PublicUser>('/users/me')
}
