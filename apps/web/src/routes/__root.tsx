import { cn } from '@lynx/shared'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router'
import { ToastStack } from '@/components/toast-stack'
import { CommandPalette } from '@/features/command-palette/command-palette'
import { Sidebar } from '@/layouts/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const theme = useUiStore((state) => state.theme)

  return (
    <div className={cn(theme === 'dark' && 'dark', 'bg-background text-foreground min-h-screen')}>
      {isAuthenticated ? (
        <div className="flex">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
      <CommandPalette />
      <ToastStack />
    </div>
  )
}
