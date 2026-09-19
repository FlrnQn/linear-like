import { useMutation } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/auth-store'

import { signup } from './api'

export function useSignup() {
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  })
}
