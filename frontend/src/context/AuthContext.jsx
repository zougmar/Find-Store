import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { translateAdmin } from '../i18n'

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
      const workspace = /^\/(admin|moderator|delivery)/.test(window.location.pathname)
      const lang = localStorage.getItem('findstore-workspace-lang') || 'en'
      toast.success(workspace ? translateAdmin(lang, 'auth.loginSuccess') : 'تم تسجيل الدخول بنجاح')
      return res.data
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر تسجيل الدخول')
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
      toast.success('تم إنشاء الحساب بنجاح', {
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
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'تعذر إنشاء الحساب. حاول مرة أخرى.'
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
      toast.success('تم تسجيل الدخول عبر جوجل', {
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
      toast.success('تم تسجيل الدخول عبر فيسبوك', {
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
      const errorMessage = error.response?.data?.message || 'تعذر تسجيل الدخول عبر فيسبوك'
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    const workspace = /^\/(admin|moderator|delivery)/.test(window.location.pathname)
    const lang = localStorage.getItem('findstore-workspace-lang') || 'en'
    toast.success(workspace ? translateAdmin(lang, 'auth.loggedOut') : 'تم تسجيل الخروج')
  }

  const value = {
    user,
    loading,
    login,
    register,
    registerWithGoogle,
    registerWithFacebook,
    logout,
    updateUser: (partial) => setUser((current) => (current ? { ...current, ...partial } : current)),
    fetchUser,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

