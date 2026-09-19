import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { LoginForm } from '@/features/auth/login-form'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-xl border p-6">
        <h1 className="mb-1 text-lg font-semibold">Welcome back</h1>
        <p className="text-muted-foreground mb-6 text-sm">Sign in to your LYNX workspace.</p>
        <LoginForm onSuccess={() => void navigate({ to: redirectTo ?? '/' })} />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          No account?{' '}
          <Link to="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
