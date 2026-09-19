import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/stores/auth-store'

import { logout } from './api'

export function useLogout() {
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearAuth()
      queryClient.clear()
    },
  })
}
