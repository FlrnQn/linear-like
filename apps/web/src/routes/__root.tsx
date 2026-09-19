import { cn } from '@lynx/shared'
import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

import type { RouterContext } from '@/app/router'
import { ToastStack } from '@/components/toast-stack'
import { TooltipProvider } from '@/components/tooltip'
import { CommandPalette } from '@/features/command-palette/command-palette'
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { Sidebar } from '@/layouts/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) return children

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const theme = useUiStore((state) => state.theme)

  return (
    <div className={cn(theme === 'dark' && 'dark', 'bg-background text-foreground min-h-screen')}>
      <TooltipProvider>
        {isAuthenticated ? (
          <div className="flex">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </div>
        ) : (
          <PageTransition>
            <Outlet />
          </PageTransition>
        )}
        <CommandPalette />
        <ToastStack />
      </TooltipProvider>
    </div>
  )
}
