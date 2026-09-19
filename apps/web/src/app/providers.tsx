import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useEffect } from 'react'

import { bootstrapSession } from '@/features/auth/bootstrap-session'
import { Scene3D } from '@/features/three/scene-3d'
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
      <div className="bg-background text-muted-foreground dark flex min-h-screen flex-col items-center justify-center gap-2 text-sm">
        <Scene3D variant="boot" className="h-20 w-20" />
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
