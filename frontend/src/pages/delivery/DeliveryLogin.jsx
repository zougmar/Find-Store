import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import logoImage from '../../images/logo.png'

const DeliveryLogin = () => {
  const [formData, setFormData] = useState({ email: '', phone: '', password: '' })
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const loginData = {
        password: formData.password
      }

      if (loginMethod === 'email') {
        if (!formData.email) {
          toast.error('Email is required')
          setLoading(false)
          return
        }
        loginData.email = formData.email
      } else {
        if (!formData.phone) {
          toast.error('Phone number is required')
          setLoading(false)
          return
        }
        loginData.phone = formData.phone
      }

      const res = await api.post('/delivery/login', loginData)
      
      // Debug: Log the response to see what we got
      console.log('Login response:', {
        userId: res.data._id,
        email: res.data.email,
        role: res.data.role,
        hasToken: !!res.data.token
      })
      
      // Verify the user has delivery role before storing token
      if (res.data.role !== 'delivery') {
        console.error('Login failed - wrong role:', {
          expected: 'delivery',
          actual: res.data.role,
          email: res.data.email
        })
        
        // Show clear error with instructions
        const errorMsg = res.data.role 
          ? `Your account role is '${res.data.role}'. You need 'delivery' role. Contact admin or go to Admin Panel → Users → Edit Role → Select "Delivery Man"`
          : `Account found but role is missing. Please contact admin.`
        
        toast.error(errorMsg, { 
          duration: 8000,
          icon: '⚠️'
        })
        return
      }
      
      localStorage.setItem('delivery_token', res.data.token)
      localStorage.setItem('delivery_user', JSON.stringify(res.data))
      
      toast.success('Login successful!')
      navigate('/delivery/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Logo Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
            <img 
              src={logoImage} 
              alt="Find Store Logo" 
              className="h-20 mx-auto mb-4 object-contain drop-shadow-lg"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Delivery Portal</h1>
            <p className="text-blue-100 text-sm">Livreur Login</p>
          </div>
          
          <div className="p-6">
            {/* Login Method Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Phone
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loginMethod === 'email' ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="delivery@example.com"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Need Delivery Role Access?</p>
                    <p className="text-blue-700">If you see a role error, ask an admin to update your role to "Delivery Man" in the Admin Panel → Users section.</p>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">
                <p>For delivery personnel only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryLogin
