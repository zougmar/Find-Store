import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdminI18n } from '../context/AdminLanguageContext'

const DocumentDirection = () => {
  const location = useLocation()
  const { language } = useAdminI18n()
  const workspace = /^\/(admin|moderator|delivery)/.test(location.pathname)

  useEffect(() => {
    const lang = workspace ? language : 'ar'
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
    document.body.setAttribute('dir', dir)
  }, [workspace, language])

  return null
}

export default DocumentDirection
