import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-xl border p-6">
        <h1 className="mb-1 text-lg font-semibold">{t('signup.title')}</h1>
        <p className="text-muted-foreground mb-6 text-sm">{t('signup.subtitle')}</p>
        <SignupForm onSuccess={() => void navigate({ to: '/' })} />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-accent hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </main>
  )
}
