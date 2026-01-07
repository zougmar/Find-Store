import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import logoImage from '../images/logo.png'

const ModeratorSidebar = ({ isOpen = true, onClose, user }) => {
  const location = useLocation()
  const [imageKey, setImageKey] = useState(0)

  useEffect(() => {
    const handleUserUpdate = () => {
      setImageKey(prev => prev + 1)
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [])

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/moderator/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Orders',
      path: '/moderator/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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

  return (
    <div className={`bg-gradient-to-b from-indigo-600 to-indigo-700 text-white w-64 min-h-screen fixed left-0 top-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo Header */}
      <div className="p-6 border-b border-indigo-500/50 flex justify-center items-center relative bg-indigo-700/50">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-xl border-2 border-indigo-400/30 flex items-center justify-center ring-2 ring-indigo-400/20">
              <img 
                src={logoImage} 
                alt="Find Store Moderator Logo" 
                className="w-full h-full rounded-lg object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center hidden">
                <span className="text-white font-bold text-xl">FS</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Find Store</p>
            <p className="text-xs text-indigo-200 font-medium">Moderator Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden absolute right-4 top-4 p-2 rounded-lg hover:bg-indigo-500/50 transition-colors text-white"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Navigation Menu */}
      <div className="p-4 flex-1 flex flex-col overflow-y-auto">
        <nav className="space-y-2">
          <div className="px-2 py-2 mb-2">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Main Menu</p>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose && window.innerWidth < 1024 && onClose()}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                isActive(item.path)
                  ? 'bg-white text-indigo-600 shadow-lg shadow-black/20'
                  : 'text-indigo-100 hover:bg-indigo-500/50 hover:text-white'
              }`}
            >
              <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-indigo-600' : 'text-indigo-200 group-hover:text-white'}`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.name}</span>
              {isActive(item.path) && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-indigo-600"></div>
              )}
            </Link>
          ))}
        </nav>
        
        {/* Quick Stats or Info Section */}
        <div className="mt-6 px-4">
          <div className="bg-indigo-500/30 rounded-xl p-4 border border-indigo-400/30">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-2">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-indigo-100">Order verification active</span>
            </div>
          </div>
        </div>
        
        {/* User Info at Bottom */}
        <div className="mt-auto pt-4 border-t border-indigo-500/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-500/30 transition-all duration-200 group">
            {user?.image ? (
              <img
                key={`${user.image}-${imageKey}`}
                src={user.image}
                alt={user.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-indigo-400/50 group-hover:border-white transition-colors"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div 
              className={`w-10 h-10 rounded-lg bg-white text-indigo-600 flex items-center justify-center border-2 border-indigo-400/50 group-hover:border-white transition-colors font-semibold ${user?.image ? 'hidden' : ''}`}
            >
              <span className="text-sm">
                {(user?.name || 'M').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Moderator'}</p>
              <p className="text-xs text-indigo-200 truncate">{user?.role === 'admin' ? 'Administrator' : 'Moderator'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModeratorSidebar

