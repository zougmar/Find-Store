import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logoImage from '../images/logo.png'
import { useAdminI18n } from '../context/AdminLanguageContext'

const ModeratorSidebar = ({ isOpen = true, onClose, user }) => {
  const location = useLocation()
  const { t } = useAdminI18n()
  const [imageKey, setImageKey] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const handleUserUpdate = () => {
      setImageFailed(false)
      setImageKey(prev => prev + 1)
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [])

  const menuItems = [
    {
      name: t('nav.dashboard'),
      path: '/moderator/dashboard',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: t('nav.orders'),
      path: '/moderator/orders',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      name: t('nav.requests'),
      path: '/moderator/product-inquiries',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      )
    }
  ]

  const isActive = (path) => {
    if (path === '/moderator/dashboard') {
      return location.pathname === '/moderator/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const showPhoto = user?.image && !imageFailed
  const roleLabel = user?.role === 'admin' ? t('header.administrator') : t('role.moderator')

  return (
    <aside className={`fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-white/10 bg-[#0b1220] text-white shadow-[8px_0_30px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : 'max-lg:-translate-x-full rtl:max-lg:translate-x-full'
    }`}>
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-white/15">
          <img
            src={logoImage}
            alt="FINDSTORE"
            className="h-full w-full rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-white">FINDSTORE</p>
          <p className="truncate text-xs text-slate-400">{t('page.moderator')}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mx-4 h-px bg-white/10" />

      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 rtl:tracking-normal">
          {t('nav.mainMenu')}
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose && window.innerWidth < 1024 && onClose()}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-violet-400" />
                )}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-violet-400/15 text-violet-300' : 'bg-white/5 text-slate-400 group-hover:text-white'
                }`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            {showPhoto ? (
              <img
                key={`${user.image}-${imageKey}`}
                src={user.image}
                alt={user.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-semibold text-violet-200 ring-2 ring-white/10">
                {(user?.name || 'M').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Moderator'}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="truncate">{roleLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ModeratorSidebar
