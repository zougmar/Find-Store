import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ModeratorSidebar from './ModeratorSidebar'

const ModeratorLayout = ({ children, title }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Get user from localStorage
  const storedUser = localStorage.getItem('moderator_user')
  let user = null
  try {
    user = storedUser ? JSON.parse(storedUser) : null
  } catch (e) {
    console.error('Error parsing moderator user:', e)
  }

  const handleLogout = () => {
    localStorage.removeItem('moderator_token')
    localStorage.removeItem('moderator_user')
    navigate('/moderator/login')
  }

  const getPageTitle = () => {
    if (title) return title
    if (location.pathname === '/moderator/dashboard') return 'Dashboard'
    if (location.pathname === '/moderator/orders') return 'Order Management'
    return 'Moderator Panel'
  }

  const isDashboard = location.pathname === '/moderator/dashboard' || location.pathname === '/moderator/'

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <ModeratorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top Bar - cPanel Style */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
          <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-3">
                  {!isDashboard && (
                    <button
                      onClick={() => navigate('/moderator/dashboard')}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group border border-gray-200"
                      title="Back to Dashboard"
                    >
                      <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="font-medium text-sm">Dashboard</span>
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Store
                </Link>
                
                {/* User Profile Dropdown */}
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-900">{user?.name || 'Moderator'}</span>
                    <span className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'Moderator'}</span>
                  </div>
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-white font-semibold text-sm">
                        {(user?.name || 'M').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default ModeratorLayout

