import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdminI18n } from '../context/AdminLanguageContext'
import logoAdminImage from '../images/logoadmin.png'

const AdminSidebar = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
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
      path: '/admin',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: t('nav.orders'),
      path: '/admin/orders',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      name: t('nav.users'),
      path: '/admin/users',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: t('nav.products'),
      path: '/admin/products',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: t('nav.messages'),
      path: '/admin/messages',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: t('nav.requests'),
      path: '/admin/product-inquiries',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      )
    },
    {
      name: t('nav.settings'),
      path: '/admin/pages',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const showPhoto = user?.image && !imageFailed

  return (
    <aside className={`fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e border-white/10 bg-[#0b1220] text-white shadow-[8px_0_30px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : 'max-lg:-translate-x-full rtl:max-lg:translate-x-full'
    }`}>
      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-white/15">
          <img
            src={logoAdminImage}
            alt="FINDSTORE"
            className="h-full w-full rounded-xl object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight text-white">FINDSTORE</p>
          <p className="truncate text-xs text-slate-400">{t('nav.controlPanel')}</p>
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
                  <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-sky-400" />
                )}
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-sky-400/15 text-sky-300' : 'bg-white/5 text-slate-400 group-hover:text-white'
                }`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition-colors hover:bg-white/[0.08]"
          >
            {showPhoto ? (
              <img
                key={`${user.image}-${imageKey}`}
                src={user.image}
                alt={user.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-200 ring-2 ring-white/10">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span className="truncate">{t('header.administrator')}</span>
              </p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar
