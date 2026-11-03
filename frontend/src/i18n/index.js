import ar from './locales/ar.json'
import fr from './locales/fr.json'
import en from './locales/en.json'

const dictionaries = { ar, fr, en }

export const ADMIN_LANGUAGES = ['ar', 'fr', 'en']

export function normalizeAdminLanguage(value) {
  return ADMIN_LANGUAGES.includes(value) ? value : 'en'
}

export function translateAdmin(language, key) {
  const lang = normalizeAdminLanguage(language)
  return dictionaries[lang]?.[key] || dictionaries.en[key] || key
}

export function isAdminRtl(language) {
  return normalizeAdminLanguage(language) === 'ar'
}
