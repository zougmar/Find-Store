import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const ModeratorLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await api.post('/moderator/login', formData)
      
      // Verify the user has moderator or admin role
      if (!['moderator', 'admin'].includes(res.data.role)) {
        console.error('Login failed - wrong role:', {
          expected: ['moderator', 'admin'],
          actual: res.data.role,
          email: res.data.email
        })
        toast.error(`Login failed: Your account role is '${res.data.role || 'unknown'}', but 'moderator' or 'admin' is required. Please contact admin to update your role.`, { 
          duration: 8000,
          icon: '⚠️'
        })
        return
      }

      // Check if moderator has manageOrders permission
      // If permissions object exists but manageOrders is false, deny access
      if (res.data.role === 'moderator' && res.data.permissions && typeof res.data.permissions === 'object') {
        if (!res.data.permissions.manageOrders) {
          const errorMsg = `✅ Password is correct! But your account does not have "Manage Orders" permission.\n\n📋 How to fix:\n1. Go to Admin Panel: /admin\n2. Go to Users page\n3. Find your user (${res.data.email})\n4. Click "Edit Role"\n5. Enable "Manage Orders" permission\n6. Click "Update User"\n7. Login again here.`
          
          toast.error(errorMsg, { 
            duration: 10000,
            icon: '⚠️'
          })
          return
        }
      }

      // Store token and user data
      localStorage.setItem('moderator_token', res.data.token)
      localStorage.setItem('moderator_user', JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        role: res.data.role,
        permissions: res.data.permissions || {},
        image: res.data.image || ''
      }))

      console.log('Moderator login successful:', {
        userId: res.data._id,
        email: res.data.email,
        role: res.data.role
      })

      toast.success(`Welcome back, ${res.data.name}!`, { icon: '✅' })
      navigate('/moderator/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.'
      toast.error(errorMessage, { duration: 5000, icon: '❌' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Moderator Portal</h1>
          <p className="text-gray-600">Sign in to manage orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="moderator@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/contact" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Contact Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModeratorLogin

