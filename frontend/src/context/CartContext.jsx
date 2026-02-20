import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showGuestCheckoutModal, setShowGuestCheckoutModal] = useState(false)
  const { user } = useAuth()

  // Load cart from backend when user logs in
  useEffect(() => {
    if (user) {
      loadCartFromServer()
    } else {
      // User logged out, load from localStorage
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart)
          const valid = Array.isArray(parsed) ? parsed.filter(item => item && item.product != null) : []
          setCartItems(valid)
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
          setCartItems([])
        }
      }
    }
  }, [user])

  // Save to localStorage for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cartItems))
    }
  }, [cartItems, user])

  const loadCartFromServer = async () => {
    try {
      setLoading(true)
      const res = await api.get('/cart')
      const serverCart = res.data
      
      // Convert server cart format to local format
      const formattedItems = serverCart.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }))
      
      // Get local cart for merging
      const localCart = localStorage.getItem('cart')
      if (localCart) {
        try {
          const localItems = JSON.parse(localCart)
          // Merge local cart with server cart
          await syncCartWithServer(localItems)
          return
        } catch (error) {
          console.error('Error parsing local cart:', error)
        }
      }
      
      setCartItems(formattedItems)
    } catch (error) {
      console.error('Error loading cart from server:', error)
      // Fallback to localStorage
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart))
        } catch (e) {
          setCartItems([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const syncCartWithServer = async (localItems) => {
    try {
      const res = await api.post('/cart/sync', { items: localItems })
      const serverCart = res.data
      const formattedItems = serverCart.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      }))
      setCartItems(formattedItems)
      // Clear local storage after sync
      localStorage.removeItem('cart')
    } catch (error) {
      console.error('Error syncing cart:', error)
      // If sync fails, just load server cart
      loadCartFromServer()
    }
  }

  const saveCartToServer = async (items) => {
    if (!user) return
    
    try {
      // Update each item in the cart
      for (const item of items) {
        if (!item.product) continue
        const productId = item.product._id || item.product
        const existingItem = await api.get('/cart')
          .then(res => res.data.items.find(i => 
            i.product && (i.product._id === productId || i.product.toString() === productId)
          ))
        
        if (existingItem) {
          await api.put(`/cart/${existingItem._id}`, { quantity: item.quantity })
        } else {
          await api.post('/cart', { productId, quantity: item.quantity })
        }
      }
    } catch (error) {
      console.error('Error saving cart to server:', error)
    }
  }

  const addToCart = async (product, quantity = 1) => {
    if (user) {
      // Save to server for logged-in users
      try {
        await api.post('/cart', { productId: product._id, quantity })
        await loadCartFromServer()
      } catch (error) {
        console.error('Error adding to cart:', error)
        // Fallback to local update
        setCartItems(prevItems => {
          const existingItem = prevItems.find(item => 
            item.product && (item.product._id || item.product) === product._id
          )
          
          if (existingItem) {
            return prevItems.map(item =>
              item.product && (item.product._id || item.product) === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
          
          return [...prevItems, { product, quantity }]
        })
      }
    } else {
      // Save to localStorage for guests and open guest checkout form
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => 
          item.product && (item.product._id || item.product) === product._id
        )
        
        if (existingItem) {
          return prevItems.map(item =>
            item.product && (item.product._id || item.product) === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
        
        return [...prevItems, { product, quantity }]
      })
      setShowGuestCheckoutModal(true)
    }
  }

  const removeFromCart = async (productId) => {
    if (user) {
      // Remove from server for logged-in users
      try {
        const res = await api.get('/cart')
        const cart = res.data
        const itemToRemove = cart.items.find(item => 
          item.product && (item.product._id === productId || item.product.toString() === productId)
        )
        
        if (itemToRemove) {
          await api.delete(`/cart/${itemToRemove._id}`)
          await loadCartFromServer()
        }
      } catch (error) {
        console.error('Error removing from cart:', error)
        // Fallback to local update
        setCartItems(prevItems => prevItems.filter(item => 
          item.product && (item.product._id || item.product) !== productId
        ))
      }
    } else {
      // Remove from localStorage for guests
      setCartItems(prevItems => prevItems.filter(item => 
        item.product && (item.product._id || item.product) !== productId
      ))
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }
    
    if (user) {
      // Update on server for logged-in users
      try {
        const res = await api.get('/cart')
        const cart = res.data
        const itemToUpdate = cart.items.find(item => 
          item.product && (item.product._id === productId || item.product.toString() === productId)
        )
        
        if (itemToUpdate) {
          await api.put(`/cart/${itemToUpdate._id}`, { quantity })
          await loadCartFromServer()
        }
      } catch (error) {
        console.error('Error updating quantity:', error)
        // Fallback to local update
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.product && (item.product._id || item.product) === productId ? { ...item, quantity } : item
          )
        )
      }
    } else {
      // Update localStorage for guests
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product && (item.product._id || item.product) === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = async () => {
    if (user) {
      // Clear on server for logged-in users
      try {
        await api.delete('/cart')
        setCartItems([])
      } catch (error) {
        console.error('Error clearing cart:', error)
        setCartItems([])
      }
    } else {
      // Clear localStorage for guests
      setCartItems([])
    }
  }

  // Helper function to get the final price (with discount applied)
  const getFinalPrice = (product) => {
    if (!product || typeof product !== 'object' || product.price == null) return 0
    const discountPercentage = product.discountPercentage || 0
    if (discountPercentage > 0) {
      return product.price * (1 - discountPercentage / 100)
    }
    return product.price
  }

  const getCartTotal = () => {
    if (!Array.isArray(cartItems)) return 0
    return cartItems.reduce((total, item) => {
      const product = item.product
      if (!product) return total
      const finalPrice = getFinalPrice(product)
      const qty = Number(item.quantity) || 0
      return total + (finalPrice * qty)
    }, 0)
  }

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const openGuestCheckoutModal = () => setShowGuestCheckoutModal(true)
  const closeGuestCheckoutModal = () => setShowGuestCheckoutModal(false)

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getFinalPrice,
    loadCartFromServer,
    showGuestCheckoutModal,
    openGuestCheckoutModal,
    closeGuestCheckoutModal,
    setShowGuestCheckoutModal
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

