import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { useUiStore } from '@/stores/ui-store'

import en from './locales/en.json'
import fr from './locales/fr.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: useUiStore.getState().language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

useUiStore.subscribe((state, prevState) => {
  if (state.language !== prevState.language) {
    void i18n.changeLanguage(state.language)
  }
})

export { i18n }
