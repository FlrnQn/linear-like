import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { LoginForm } from '@/features/auth/login-form'
import { Scene3D } from '@/features/three/scene-3d'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <Scene3D
        variant="login"
        className="pointer-events-none absolute right-[10%] top-1/2 h-64 w-64 -translate-y-1/2 opacity-80 sm:right-[18%]"
      />
      <div className="border-border bg-surface relative z-10 w-full max-w-sm rounded-xl border p-6">
        <h1 className="mb-1 text-lg font-semibold">{t('login.title')}</h1>
        <p className="text-muted-foreground mb-6 text-sm">{t('login.subtitle')}</p>
        <LoginForm onSuccess={() => void navigate({ to: redirectTo ?? '/' })} />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-accent hover:underline">
            {t('auth.createOne')}
          </Link>
        </p>
      </div>
    </main>
  )
}
