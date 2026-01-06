import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from './AdminSidebar'

const AdminLayout = ({ children, title }) => {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getPageTitle = () => {
    if (title) return title
    if (location.pathname === '/admin') return 'Dashboard'
    if (location.pathname === '/admin/users') return 'User Management'
    if (location.pathname === '/admin/products') return 'Product Management'
    if (location.pathname === '/admin/orders') return 'Order Management'
    if (location.pathname === '/admin/pages') return 'Page Settings'
    return 'Admin Panel'
  }

  const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-sm sticky top-0 z-30 border-b border-gray-200">
          <div className="px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {!isDashboard && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                  title="Back to Dashboard"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline font-medium">Back to Dashboard</span>
                </button>
              )}
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 px-2 md:px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-xs md:text-sm"
              >
                <span className="hidden sm:inline">View Store</span>
                <span className="sm:hidden">Store</span>
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-md transition-colors text-xs md:text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

