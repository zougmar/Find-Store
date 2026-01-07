import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, adminOnly = false, moderatorOnly = false, deliveryOnly = false }) => {
  const { user, loading } = useAuth()

  // For moderator/delivery routes, check localStorage tokens directly since they don't use AuthContext
  if (moderatorOnly || deliveryOnly) {
    if (moderatorOnly) {
      const moderatorToken = localStorage.getItem('moderator_token')
      const moderatorUser = localStorage.getItem('moderator_user')
      
      if (!moderatorToken || !moderatorUser) {
        return <Navigate to="/moderator/login" replace />
      }

      try {
        const userData = JSON.parse(moderatorUser)
        if (!['moderator', 'admin'].includes(userData.role)) {
          return <Navigate to="/moderator/login" replace />
        }
        // User is valid, render children
        return children
      } catch (e) {
        // Invalid user data, redirect to login
        return <Navigate to="/moderator/login" replace />
      }
    }

    if (deliveryOnly) {
      const deliveryToken = localStorage.getItem('delivery_token')
      const deliveryUser = localStorage.getItem('delivery_user')
      
      if (!deliveryToken || !deliveryUser) {
        return <Navigate to="/delivery/login" replace />
      }

      try {
        const userData = JSON.parse(deliveryUser)
        if (userData.role !== 'delivery') {
          return <Navigate to="/delivery/login" replace />
        }
        // User is valid, render children
        return children
      } catch (e) {
        // Invalid user data, redirect to login
        return <Navigate to="/delivery/login" replace />
      }
    }
  }

  // For regular routes that use AuthContext
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute

