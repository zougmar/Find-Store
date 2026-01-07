import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ totalOrders: 0, deliveredOrders: 0, pendingOrders: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('delivery_token')
    if (!token) {
      navigate('/delivery/login')
      return
    }

    // Verify token is still valid by checking if user data exists
    const storedUser = localStorage.getItem('delivery_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        if (userData.role !== 'delivery') {
          toast.error('Your account does not have delivery man role. Please contact admin.', { duration: 7000 })
          return
        }
      } catch (e) {
        console.error('Error parsing stored user:', e)
      }
    }

    fetchProfile()
    fetchOrders()
  }, [navigate])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/me')
      setUser(res.data)
      if (res.data.stats) {
        setStats(res.data.stats)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load profile'
      const debugInfo = error.response?.data?.debug
      
      // Check if it's a role issue specifically
      if (error.response?.status === 403 && debugInfo && debugInfo.includes('role')) {
        console.error('Role error:', debugInfo)
        toast.error('Your account does not have delivery man role. Please contact admin to update your role.', { 
          duration: 7000,
          icon: '⚠️'
        })
        // Don't logout immediately - let them see the error and contact admin
        // They might need to wait for admin to update their role
        return
      }
      
      // Only logout for actual authentication errors (401) or token failures
      if (error.response?.status === 401) {
        localStorage.removeItem('delivery_token')
        localStorage.removeItem('delivery_user')
        toast.error('Session expired. Please log in again.')
        navigate('/delivery/login')
      } else if (error.response?.status === 403 && !debugInfo?.includes('role')) {
        // Other 403 errors (not role-related)
        toast.error(errorMessage || 'Access denied.')
      }
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get('/delivery/orders')
      setOrders(res.data || [])
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load orders'
      const debugInfo = error.response?.data?.debug
      
      console.error('Error fetching orders:', error)
      if (debugInfo) {
        console.error('Debug info:', debugInfo)
        if (debugInfo.includes('role')) {
          toast.error('Your account does not have delivery man role. Please contact admin to update your role.', { duration: 5000 })
        } else {
          toast.error(errorMessage, { duration: 5000 })
        }
      } else {
        toast.error(errorMessage)
      }
      
      // Only logout for authentication errors (401), not role errors
      if (error.response?.status === 401) {
        localStorage.removeItem('delivery_token')
        localStorage.removeItem('delivery_user')
        toast.error('Session expired. Please log in again.')
        navigate('/delivery/login')
      } else if (error.response?.status === 403) {
        // For role errors, show error but don't logout - they need to contact admin
        if (debugInfo && debugInfo.includes('role')) {
          // Role error - don't logout, let them see the error
          toast.error('Your account does not have delivery man role. Please contact admin to update your role.', {
            duration: 7000,
            icon: '⚠️'
          })
        } else {
          // Other 403 errors
          toast.error(errorMessage)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('delivery_token')
    localStorage.removeItem('delivery_user')
    navigate('/delivery/login')
    toast.success('Logged out successfully')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'on_the_way':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered'
      case 'on_the_way':
        return 'On the Way'
      case 'picked_up':
        return 'Picked Up'
      case 'failed':
        return 'Failed'
      default:
        return 'Pending'
    }
  }

  const filteredOrders = orders.filter(order => 
    order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'failed'
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
              <p className="text-blue-100 text-sm mt-1">
                {user?.name || 'Loading...'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            <div className="text-xs text-gray-500 mt-1">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</div>
            <div className="text-xs text-gray-500 mt-1">Delivered</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
        </div>

        {/* QR Scanner Button */}
        <Link
          to="/delivery/scan"
          className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-4 rounded-lg font-semibold text-center mb-6 shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </div>
        </Link>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">My Assigned Orders</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No pending orders</p>
              <p className="text-gray-400 text-sm mt-2">All assigned orders have been completed</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order._id}
                to={`/delivery/orders/${order._id}`}
                className="block bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.user?.name || 'Customer'}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.deliveryStatus || 'pending')}`}>
                    {getStatusLabel(order.deliveryStatus || 'pending')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {order.shippingAddress?.city || order.user?.address?.city || 'N/A'}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {order.items?.length || 0} item(s)
                    </div>
                    <div className="font-bold text-lg text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryDashboard
