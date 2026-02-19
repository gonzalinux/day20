import { createI18n, type I18n } from 'vue-i18n'
import en from './en'
import es from './es'

/**
 * Prefix a path with the locale segment. English (default) has no prefix.
 */
export function localePath(path: string, locale: string): string {
  return locale === 'en' ? path : `/${locale}${path}`
}

export function createI18nInstance(): I18n {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, es },
  })
}
