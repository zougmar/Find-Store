import { useAdminI18n } from '../context/AdminLanguageContext'

const LanguageSwitcher = ({ className = '' }) => {
  const { language, changeLanguage, t } = useAdminI18n()

  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="font-medium text-gray-600 hidden sm:inline">{t('language.label')}</span>
      <select
        value={language}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label={t('language.label')}
        className="h-10 rounded-lg border border-gray-200 bg-white px-3 font-semibold text-gray-900"
      >
        <option value="ar">{t('language.ar')}</option>
        <option value="fr">{t('language.fr')}</option>
        <option value="en">{t('language.en')}</option>
      </select>
    </label>
  )
}

export default LanguageSwitcher
