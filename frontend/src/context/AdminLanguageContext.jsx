import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { isAdminRtl, normalizeAdminLanguage, translateAdmin } from '../i18n'

const AdminLanguageContext = createContext(null)
const GUEST_KEY = 'findstore-workspace-lang'

const userKey = (id) => `${GUEST_KEY}:${id}`

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function AdminLanguageProvider({ children }) {
  const location = useLocation()
  const { user, updateUser } = useAuth()
  const area = location.pathname.startsWith('/moderator')
    ? 'moderator'
    : location.pathname.startsWith('/delivery')
      ? 'delivery'
      : location.pathname.startsWith('/admin')
        ? 'admin'
        : 'store'

  const identity = useMemo(() => {
    if (area === 'moderator') {
      const stored = readJson('moderator_user')
      return stored?._id ? { id: stored._id, preferred: stored.preferredLanguage, storageKey: 'moderator_user' } : null
    }
    if (area === 'delivery') {
      const stored = readJson('delivery_user')
      return stored?._id ? { id: stored._id, preferred: stored.preferredLanguage, storageKey: 'delivery_user' } : null
    }
    if (area === 'admin' && user?._id) {
      return { id: user._id, preferred: user.preferredLanguage, storageKey: null }
    }
    return null
  }, [area, user])

  const [language, setLanguage] = useState(() => normalizeAdminLanguage(localStorage.getItem(GUEST_KEY) || 'en'))

  useEffect(() => {
    if (identity?.id && identity.preferred) {
      const next = normalizeAdminLanguage(identity.preferred)
      setLanguage(next)
      localStorage.setItem(userKey(identity.id), next)
      return
    }
    if (identity?.id) {
      const cached = localStorage.getItem(userKey(identity.id))
      if (cached) setLanguage(normalizeAdminLanguage(cached))
      return
    }
    if (area !== 'store') {
      setLanguage(normalizeAdminLanguage(localStorage.getItem(GUEST_KEY) || 'en'))
    }
  }, [area, identity?.id, identity?.preferred])

  const changeLanguage = async (nextLanguage) => {
    const lang = normalizeAdminLanguage(nextLanguage)
    setLanguage(lang)
    localStorage.setItem(GUEST_KEY, lang)

    if (identity?.id) {
      localStorage.setItem(userKey(identity.id), lang)
      if (identity.storageKey) {
        const current = readJson(identity.storageKey) || {}
        writeJson(identity.storageKey, { ...current, preferredLanguage: lang })
      }
      if (area === 'admin' && updateUser) updateUser({ preferredLanguage: lang })

      const endpoint = area === 'moderator'
        ? '/moderator/language'
        : area === 'delivery'
          ? '/delivery/language'
          : '/auth/language'

      try {
        await api.put(endpoint, { language: lang })
      } catch (error) {
        toast.error(translateAdmin(lang, 'language.saveFailed'))
      }
    }
  }

  const value = {
    language,
    isRTL: isAdminRtl(language),
    changeLanguage,
    t: (key) => translateAdmin(language, key)
  }

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  )
}

export function useAdminI18n() {
  const context = useContext(AdminLanguageContext)
  if (!context) {
    throw new Error('useAdminI18n must be used within AdminLanguageProvider')
  }
  return context
}
