import axios from 'axios'

// Use proxy in development, or full URL in production
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    // Determine which token to use based on the route being accessed
    let token = null
    const url = config.url || ''
    
    // For delivery routes, prioritize delivery_token
    if (url.includes('/delivery/')) {
      token = localStorage.getItem('delivery_token')
    }
    // For moderator routes, prioritize moderator_token
    else if (url.includes('/moderator/')) {
      token = localStorage.getItem('moderator_token')
    }
    // For admin routes, prefer main admin/user token first, then fallback to moderator token
    else if (url.includes('/admin/')) {
      token = localStorage.getItem('token') || localStorage.getItem('moderator_token')
    }
    // For all other routes, use regular token, then moderator token, then delivery token
    else {
      token = localStorage.getItem('token') || localStorage.getItem('moderator_token') || localStorage.getItem('delivery_token')
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'Token type:', url.includes('/delivery/') ? 'delivery' : url.includes('/moderator/') ? 'moderator' : 'regular')
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, response.data)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data || error.message)
    
    const url = error.config?.url || ''
    
    // Only clear tokens for the specific route that failed (don't affect other role tokens)
    if (error.response?.status === 401) {
      // For 401 errors on delivery routes, only clear delivery tokens
      if (url.includes('/delivery/')) {
        localStorage.removeItem('delivery_token')
        localStorage.removeItem('delivery_user')
        // Don't delete api.defaults.headers - let the interceptor handle it dynamically
      }
      // For 401 errors on moderator routes, only clear moderator tokens
      else if (url.includes('/moderator/')) {
        localStorage.removeItem('moderator_token')
        localStorage.removeItem('moderator_user')
        // Don't delete api.defaults.headers - let the interceptor handle it dynamically
      }
      // For 401 errors on admin routes, clear moderator token (admins use moderator_token)
      else if (url.includes('/admin/')) {
        // Only clear if it's a moderator token issue, not if it's a regular user token
        const moderatorToken = localStorage.getItem('moderator_token')
        if (moderatorToken) {
          localStorage.removeItem('moderator_token')
          localStorage.removeItem('moderator_user')
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

