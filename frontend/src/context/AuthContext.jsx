import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me')
      // Image URL should work with Vite proxy
      setUser(res.data)
      console.log('User fetched:', res.data)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data)
      toast.success('Login successful!')
      return res.data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed')
      throw error
    }
  }

  const register = async (name, email, password, phone) => {
    try {
      const res = await axios.post('/api/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone?.trim() || ''
      })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data)
      await fetchUser() // Fetch full user data after registration
      toast.success('Registration successful!', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }
      })
      return res.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.'
      toast.error(errorMessage)
      throw error
    }
  }

  const registerWithGoogle = async (googleId, email, name, image) => {
    try {
      const res = await axios.post('/api/auth/google', {
        googleId,
        email,
        name,
        image
      })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data)
      await fetchUser()
      toast.success('Signed in with Google successfully!', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }
      })
      return res.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Google sign in failed. Please try again.'
      toast.error(errorMessage)
      throw error
    }
  }

  const registerWithFacebook = async (facebookId, email, name, image) => {
    try {
      const res = await axios.post('/api/auth/facebook', {
        facebookId,
        email,
        name,
        image
      })
      localStorage.setItem('token', res.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
      setUser(res.data)
      await fetchUser()
      toast.success('Signed in with Facebook successfully!', {
        icon: '✅',
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }
      })
      return res.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Facebook sign in failed. Please try again.'
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    register,
    registerWithGoogle,
    registerWithFacebook,
    logout,
    fetchUser,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

