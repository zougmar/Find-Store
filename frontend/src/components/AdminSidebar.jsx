import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoAdminImage from '../images/logoadmin.png'

const AdminSidebar = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [imageKey, setImageKey] = useState(0)

  // Listen for user updates to refresh image
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
      path: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      name: 'Messages',
      path: '/admin/messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Settings',
      path: '/admin/pages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

  return (
    <div className={`bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white w-44 min-h-screen fixed left-0 top-0 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Logo Header */}
      <div className="p-6 border-b border-gray-700/50 flex justify-center items-center relative bg-[#1e293b]/50">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-xl border-2 border-blue-500/30 flex items-center justify-center ring-2 ring-blue-500/20">
              <img 
                src={logoAdminImage} 
                alt="Find Store Admin Logo" 
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Find Store</p>
            <p className="text-xs text-gray-400 font-medium">Control Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300"
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose && window.innerWidth < 1024 && onClose()}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              <div className={`flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.name}</span>
              {isActive(item.path) && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-white"></div>
              )}
            </Link>
          ))}
        </nav>
        
        {/* Quick Stats or Info Section */}
        <div className="mt-6 px-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-300">All systems operational</span>
            </div>
          </div>
        </div>
        
        {/* User Info at Bottom */}
        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <Link 
            to="/profile" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group"
          >
            {user?.image ? (
              <img
                key={`${user.image}-${imageKey}`}
                src={user.image}
                alt={user.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-gray-600 group-hover:border-blue-500 transition-colors"
                onError={(e) => {
                  console.error('Image load error in sidebar:', user.image, e)
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
                onLoad={() => console.log('Sidebar image loaded:', user.image)}
              />
            ) : null}
            <div 
              className={`w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center border-2 border-gray-600 group-hover:border-blue-500 transition-colors ${user?.image ? 'hidden' : ''}`}
            >
              <span className="text-white font-semibold text-sm">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 truncate">Administrator</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar

