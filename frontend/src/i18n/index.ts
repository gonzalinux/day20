import { createI18n } from 'vue-i18n'
import en from './en'
import es from './es'

/**
 * Prefix a path with the locale segment. English (default) has no prefix.
 */
export function localePath(path: string, locale: string): string {
  return locale === 'en' ? path : `/${locale}${path}`
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, es },
})

export default i18n
