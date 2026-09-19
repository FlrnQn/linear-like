import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'

import { bootstrapSession } from '@/features/auth/bootstrap-session'
import { useAuthStore } from '@/stores/auth-store'

import { queryClient } from './query-client'
import { router } from './router'

export function AppProviders() {
  const auth = useAuthStore()

  useEffect(() => {
    void bootstrapSession()
  }, [])

  if (auth.status === 'pending') {
    return (
      <div className="bg-background text-muted-foreground dark flex min-h-screen items-center justify-center text-sm">
        Loading LYNX…
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ auth }} />
    </QueryClientProvider>
  )
}
