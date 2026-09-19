import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'

import { SignupForm } from '@/features/auth/signup-form'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-xl border p-6">
        <h1 className="mb-1 text-lg font-semibold">Create your account</h1>
        <p className="text-muted-foreground mb-6 text-sm">Start your LYNX workspace in seconds.</p>
        <SignupForm onSuccess={() => void navigate({ to: '/' })} />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
