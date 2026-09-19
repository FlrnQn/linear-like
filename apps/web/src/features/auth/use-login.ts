import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/auth-store'

import { login } from './api'

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  })
}
