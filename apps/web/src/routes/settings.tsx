import { cn } from '@lynx/shared'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import { useAuthStore } from '@/stores/auth-store'
import { useUiStore } from '@/stores/ui-store'

export const Route = createFileRoute('/settings')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <Link to="/" className="text-muted-foreground hover:text-foreground text-xs">
          ← Back
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      </div>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="mb-4 text-sm font-medium">Profile</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="mb-4 text-sm font-medium">Appearance</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              theme === 'light' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              theme === 'dark' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            Dark
          </button>
        </div>
      </section>
    </main>
  )
}
