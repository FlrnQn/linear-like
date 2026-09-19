import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth-store'

import { API_URL } from './api'

export class ApiError extends Error {
  status: number
  issues?: { path: string; message: string }[]

  constructor(status: number, message: string, issues?: { path: string; message: string }[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

interface ErrorBody {
  error?: {
    message?: string
    issues?: { path: string; message: string }[]
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) return false
      const data = (await response.json()) as { accessToken: string }
      useAuthStore.getState().setAccessToken(data.accessToken)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      // Fastify's default JSON body parser 400s on an empty body sent with
      // this header (e.g. logout, delete) — only set it when there's a body.
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && !isRetry && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken()
    if (refreshed) return apiFetch<T>(path, options, true)
    useAuthStore.getState().clearAuth()
  }

  if (!response.ok) {
    const body: ErrorBody | null = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      body?.error?.message ?? i18n.t('api.requestFailed'),
      body?.error?.issues,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
