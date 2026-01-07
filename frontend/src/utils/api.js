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
    // Check for regular token, moderator token, or delivery token
    const token = localStorage.getItem('token') || localStorage.getItem('moderator_token') || localStorage.getItem('delivery_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url)
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
    
    // For 401 errors on delivery routes, clear delivery tokens
    if (error.response?.status === 401 && error.config?.url?.includes('/delivery/')) {
      localStorage.removeItem('delivery_token')
      localStorage.removeItem('delivery_user')
      delete api.defaults.headers.common['Authorization']
    }
    
    // For 401 errors on moderator routes, clear moderator tokens
    if (error.response?.status === 401 && error.config?.url?.includes('/moderator/')) {
      localStorage.removeItem('moderator_token')
      localStorage.removeItem('moderator_user')
      delete api.defaults.headers.common['Authorization']
    }
    
    return Promise.reject(error)
  }
)

export default api

