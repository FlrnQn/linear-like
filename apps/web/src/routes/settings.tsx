import { cn } from '@lynx/shared'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-16">
      <div>
        <Link to="/" className="text-muted-foreground hover:text-foreground text-xs">
          ← {t('common.back')}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{t('settings.title')}</h1>
      </div>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="mb-4 text-sm font-medium">{t('settings.profile')}</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('settings.name')}</dt>
            <dd>{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('settings.email')}</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="mb-4 text-sm font-medium">{t('settings.appearance')}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              theme === 'light' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            {t('settings.light')}
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              theme === 'dark' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            {t('settings.dark')}
          </button>
        </div>
      </section>

      <section className="border-border bg-surface rounded-xl border p-6">
        <h2 className="mb-4 text-sm font-medium">{t('settings.language')}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              language === 'en' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            {t('settings.languageEnglish')}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('fr')}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              language === 'fr' ? 'border-accent' : 'border-border text-muted-foreground',
            )}
          >
            {t('settings.languageFrench')}
          </button>
        </div>
      </section>
    </main>
  )
}
