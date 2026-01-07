import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import ModeratorLayout from '../../components/ModeratorLayout'

const ModeratorDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    newOrders: 0,
    confirmedOrders: 0,
    pendingOrders: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('moderator_token')
    if (!token) {
      navigate('/moderator/login')
      return
    }

    const storedUser = localStorage.getItem('moderator_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (!['moderator', 'admin'].includes(userData.role)) {
          toast.error('Your account does not have moderator role. Please contact admin.', { duration: 7000 })
          return
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }

    fetchProfile()
  }, [navigate])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/moderator/me')
      setUser(res.data)
      setStats(res.data.stats || stats)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('moderator_token')
        localStorage.removeItem('moderator_user')
        navigate('/moderator/login')
        toast.error('Session expired. Please login again.', { duration: 5000 })
      } else {
        toast.error('Failed to load dashboard', { duration: 3000 })
      }
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'New Orders',
      value: stats.newOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Confirmed',
      value: stats.confirmedOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Pending Delivery',
      value: stats.pendingOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    }
  ]

  return (
    <ModeratorLayout>
        {/* Stats Cards - cPanel Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={stat.textColor}>{stat.icon}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${stat.color} bg-opacity-20`}></div>
            </div>
          ))}
        </div>

        {/* Quick Actions - cPanel Style */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-indigo-700 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/moderator/orders"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-300 group border border-indigo-200 hover:border-indigo-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 mb-1">View All Orders</h3>
                <p className="text-sm text-gray-600">Verify and manage all orders</p>
              </div>
            </Link>

            <Link
              to="/moderator/orders?status=new"
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 group border border-yellow-200 hover:border-yellow-300 hover:shadow-lg"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-yellow-700 mb-1">New Orders</h3>
                <p className="text-sm text-gray-600">Review and verify new orders</p>
              </div>
            </Link>
          </div>
        </div>
    </ModeratorLayout>
  )
}

export default ModeratorDashboard

