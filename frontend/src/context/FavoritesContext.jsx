import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const FavoritesContext = createContext()

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    // Return default values if not in provider
    return {
      favorites: [],
      favoriteIds: new Set(),
      toggleFavorite: async () => false,
      isFavorited: () => false,
      fetchFavorites: async () => {}
    }
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
      setFavoriteIds(new Set())
    }
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return
    
    try {
      const res = await api.get('/favorites')
      setFavorites(res.data)
      const ids = new Set(res.data.map(fav => {
        const productId = fav.product?._id || fav.product || fav.productId
        return productId?.toString()
      }).filter(Boolean))
      setFavoriteIds(ids)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }

  const toggleFavorite = async (productId) => {
    if (!user) {
      toast.error('Please login to add favorites')
      return false
    }

    try {
      const productIdStr = productId.toString()
      const isFavorited = favoriteIds.has(productIdStr)
      
      if (isFavorited) {
        await api.delete(`/favorites/${productId}`)
        setFavoriteIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(productIdStr)
          return newSet
        })
        setFavorites(prev => prev.filter(fav => {
          const id = fav.product?._id || fav.product || fav.productId
          return id?.toString() !== productIdStr
        }))
        toast.success('Removed from favorites')
        return false
      } else {
        await api.post(`/favorites/${productId}`)
        setFavoriteIds(prev => new Set(prev).add(productIdStr))
        toast.success('Added to favorites')
        return true
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorite')
      return null
    }
  }

  const isFavorited = (productId) => {
    return favoriteIds.has(productId?.toString())
  }

  const value = {
    favorites,
    favoriteIds,
    toggleFavorite,
    isFavorited,
    fetchFavorites
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

