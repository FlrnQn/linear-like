import { useTranslation } from 'react-i18next'

import { useUiStore } from '@/stores/ui-store'

import { Tooltip } from './tooltip'

const LANGUAGE_LABELS = { en: 'EN', fr: 'FR' } as const

export function LanguageSwitch({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const language = useUiStore((state) => state.language)
  const toggleLanguage = useUiStore((state) => state.toggleLanguage)
  const other = language === 'en' ? 'fr' : 'en'
  const label = t('sidebar.switchLanguage', {
    language: other === 'en' ? t('settings.languageEnglish') : t('settings.languageFrench'),
  })

  return (
    <Tooltip content={label} side={collapsed ? 'right' : 'top'}>
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={label}
        className="border-border text-muted-foreground hover:text-foreground hover:border-accent shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
      >
        {LANGUAGE_LABELS[language]}
      </button>
    </Tooltip>
  )
}
