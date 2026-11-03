import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAdminI18n } from '../context/AdminLanguageContext'

const NotificationBell = () => {
  const { t } = useAdminI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)

  const load = async () => {
    try {
      const res = await api.get('/notifications')
      setItems(res.data.notifications || [])
      setUnread(res.data.unread || 0)
    } catch (error) {
      console.error('Failed to load notifications', error)
    }
  }

  useEffect(() => {
    load()
    const onLive = (event) => {
      const incoming = event.detail
      if (!incoming?._id) return
      setItems((current) => [incoming, ...current.filter((item) => item._id !== incoming._id)].slice(0, 40))
      setUnread((count) => count + 1)
    }
    window.addEventListener('findstore-notification', onLive)
    return () => window.removeEventListener('findstore-notification', onLive)
  }, [])

  const markRead = async (item) => {
    if (!item.read) {
      await api.put(`/notifications/${item._id}/read`).catch(() => {})
      setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, read: true } : entry))
      setUnread((count) => Math.max(0, count - 1))
    }
    setOpen(false)
    if (item.link) navigate(item.link)
  }

  const markAll = async () => {
    await api.put('/notifications/read-all').catch(() => {})
    setItems((current) => current.map((entry) => ({ ...entry, read: true })))
    setUnread(0)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
        aria-label={t('notifications.title')}
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-[#FF385C] text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-80 max-w-[80vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="font-semibold text-gray-900">{t('notifications.title')}</p>
            <button type="button" onClick={markAll} className="text-xs text-[#FF385C] font-semibold">{t('notifications.readAll')}</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">{t('notifications.empty')}</p>
            ) : items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => markRead(item)}
                className={`w-full text-start px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${item.read ? 'opacity-70' : ''}`}
              >
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-600 mt-1">{item.body}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
