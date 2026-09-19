import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="bg-background text-foreground dark min-h-screen">
      <Outlet />
    </div>
  )
}
