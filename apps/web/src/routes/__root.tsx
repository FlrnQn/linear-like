import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="bg-background text-foreground dark min-h-screen">
      <Outlet />
    </div>
  )
}
