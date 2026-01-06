import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart, getFinalPrice } = useCart()
  const { user } = useAuth()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()
  const [selectedImageIndex, setSelectedImageIndex] = useState({})
  const [enrichedCartItems, setEnrichedCartItems] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1) // 1: Payment Method, 2: Payment Details, 3: Success
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Payment form data
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  })
  const [cashOnDeliveryData, setCashOnDeliveryData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })

  // Helper function to get product ID
  const getProductId = (product) => {
    return product?._id || product
  }

  // Fetch full product data to ensure images are loaded
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const enrichedItems = await Promise.all(
          cartItems.map(async (item) => {
            try {
              // Handle both product object and product ID
              const productId = item.product?._id || item.product
              if (!productId) return item
              
              // If product is already a full object, use it
              if (item.product && item.product.name && item.product.price) {
                return item
              }
              
              // Otherwise fetch it
              const res = await api.get(`/products/${productId}`)
              return {
                ...item,
                product: res.data
              }
            } catch (error) {
              console.error('Error fetching product details:', error)
              return item // Return original item if fetch fails
            }
          })
        )
        setEnrichedCartItems(enrichedItems)
      } catch (error) {
        console.error('Error enriching cart items:', error)
        setEnrichedCartItems(cartItems)
      }
    }

    if (cartItems.length > 0) {
      fetchProductDetails()
    } else {
      setEnrichedCartItems([])
    }
  }, [cartItems])

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setCheckoutStep(1)
    setPaymentMethod('')
    setShowCheckoutModal(true)
  }
  
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method)
    setCheckoutStep(2)
  }
  
  const handleBackToPaymentMethods = () => {
    setCheckoutStep(1)
    setPaymentMethod('')
    // Reset form data
    setCardData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' })
    setCashOnDeliveryData({
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    })
  }

  const handleCompletePayment = async () => {
    // Validate payment data based on method
    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryDate || !cardData.cvv) {
        toast.error('Please fill in all card details')
        return
      }
      // Basic card number validation (should be 16 digits)
      if (cardData.cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number')
        return
      }
    } else if (paymentMethod === 'cash') {
      // Validate Cash on Delivery form
      if (!cashOnDeliveryData.name || !cashOnDeliveryData.phone || !cashOnDeliveryData.street || 
          !cashOnDeliveryData.city || !cashOnDeliveryData.state || !cashOnDeliveryData.zipCode || !cashOnDeliveryData.country) {
        toast.error('Please fill in all delivery information fields')
        return
      }
      // Basic phone validation
      if (cashOnDeliveryData.phone.length < 8) {
        toast.error('Please enter a valid phone number')
        return
      }
    }
    
    setProcessing(true)
    try {
      const orderData = {
        items: enrichedCartItems.map(item => ({
          product: item.product._id || item.product,
          quantity: item.quantity
        })),
        shippingAddress: paymentMethod === 'cash' ? {
          street: cashOnDeliveryData.street,
          city: cashOnDeliveryData.city,
          state: cashOnDeliveryData.state,
          zipCode: cashOnDeliveryData.zipCode,
          country: cashOnDeliveryData.country
        } : (user.address || {}),
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'card' ? {
          last4: cardData.cardNumber.slice(-4),
          cardName: cardData.cardName
        } : paymentMethod === 'cash' ? {
          customerName: cashOnDeliveryData.name,
          customerPhone: cashOnDeliveryData.phone,
          deliveryAddress: {
            street: cashOnDeliveryData.street,
            city: cashOnDeliveryData.city,
            state: cashOnDeliveryData.state,
            zipCode: cashOnDeliveryData.zipCode,
            country: cashOnDeliveryData.country
          }
        } : {}
      }

      const response = await api.post('/orders', orderData)
      setOrderDetails(response.data)
      clearCart()
      setOrderPlaced(true)
      setCheckoutStep(3)
      
      // Show success toast
      toast.success('Order placed successfully!', {
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order')
      setProcessing(false)
    }
  }

  const handleContinueShopping = () => {
    if (orderPlaced) {
      setShowCheckoutModal(false)
      setOrderPlaced(false)
      setOrderDetails(null)
      setCheckoutStep(1)
      setPaymentMethod('')
      setCardData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' })
      navigate('/products')
    } else {
      navigate('/products')
    }
  }

  const handleCloseModal = () => {
    if (!processing && !orderPlaced) {
      setShowCheckoutModal(false)
      setCheckoutStep(1)
      setPaymentMethod('')
      setCardData({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' })
      setCashOnDeliveryData({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      })
    }
  }

  const displayItems = enrichedCartItems.length > 0 ? enrichedCartItems : cartItems

  if (displayItems.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some products to your cart!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            {t('continueShopping')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {displayItems.map((item) => {
              // Ensure images is always an array
              let images = item.product.images || []
              if (typeof images === 'string') {
                images = images.split(',').map(img => img.trim()).filter(img => img)
              }
              if (!Array.isArray(images)) {
                images = []
              }
              
              return (
              <div
                key={getProductId(item.product)}
                className="border-b last:border-b-0 p-4 md:p-6 flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  {(() => {
                    const hasImages = images.length > 0
                    
                    if (!hasImages) {
                      return (
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )
                    }

                    // Show only the selected image (or first image by default)
                    const productId = getProductId(item.product)
                    const currentIndex = selectedImageIndex[productId] || 0
                    const displayImage = images[currentIndex] || images[0]
                    
                    return (
                      <div className="w-24 h-24 md:w-32 md:h-32">
                        <img
                          src={displayImage}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200?text=No+Image'
                          }}
                        />
                      </div>
                    )
                  })()}
                </div>
                
                <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-grow">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">
                      {item.product.name}
                    </h3>
                    {/* Price with Discount */}
                    <div className="mb-2">
                      {(() => {
                        const finalPrice = getFinalPrice(item.product)
                        const discountPercentage = item.product.discountPercentage || 0
                        const hasDiscount = discountPercentage > 0
                        
                        if (hasDiscount) {
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm md:text-base font-semibold text-gray-900">
                                  {formatCurrency(finalPrice)}
                                </span>
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                                  -{discountPercentage}%
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 line-through">
                                {formatCurrency(item.product.price)}
                              </span>
                            </div>
                          )
                        }
                        return (
                          <p className="text-sm md:text-base text-gray-600">
                            {formatCurrency(finalPrice)}
                          </p>
                        )
                      })()}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(getProductId(item.product), item.quantity - 1)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm md:text-base"
                        >
                          -
                        </button>
                        <span className="font-semibold text-sm md:text-base">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(getProductId(item.product), item.quantity + 1)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm md:text-base"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(getProductId(item.product))}
                        className="text-red-600 hover:text-red-700 text-xs md:text-sm font-medium"
                      >
                        {t('remove')}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`text-left sm:${isRTL ? 'text-left' : 'text-right'}`}>
                    <p className="text-base md:text-lg font-bold text-gray-900">
                      {formatCurrency(getFinalPrice(item.product) * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('orderSummary') || 'Order Summary'}</h2>
            
            <div className="space-y-2 mb-4">
              <div className={`flex justify-between text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('subtotal') || 'Subtotal'}</span>
                <span>{formatCurrency(getCartTotal())}</span>
              </div>
              <div className={`flex justify-between text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('shipping') || 'Shipping'}</span>
                <span>{t('free') || 'Free'}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className={`flex justify-between text-xl font-bold text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span>{t('total')}</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] mb-4"
            >
              {t('proceedToCheckout') || 'Proceed to Checkout'}
            </button>

            <button
              onClick={handleContinueShopping}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:bg-gray-50"
            >
              {t('continueShopping')}
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            {checkoutStep === 1 ? (
              <>
                {/* Step 1: Payment Method Selection */}
                <div className="p-4 md:p-8">
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('selectPaymentMethod') || 'Select Payment Method'}</h2>
                    {!processing && (
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">{t('orderSummary') || 'Order Summary'}</h3>
                    <div className="space-y-2">
                      {displayItems.map((item) => (
                        <div key={getProductId(item.product)} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(getFinalPrice(item.product) * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>{t('total')}</span>
                          <span>{formatCurrency(getCartTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coming Soon Message */}
                  <div className="mb-4 md:mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 md:p-8 text-center">
                      <div className="mb-4">
                        <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Payment System</h3>
                      <p className="text-base md:text-lg text-gray-700 font-medium mb-1">Coming Soon!</p>
                      <p className="text-sm md:text-base text-gray-600 mt-2">
                        We're working hard to bring you a seamless payment experience. Checkout functionality will be available shortly.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : checkoutStep === 2 ? (
              <>
                {/* Step 2: Payment Details */}
                <div className="p-4 md:p-8">
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBackToPaymentMethods}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        {paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                      </h2>
                    </div>
                    {!processing && (
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">{t('total')}</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(getCartTotal())}</span>
                    </div>
                  </div>

                  {/* Payment Forms */}
                  {paymentMethod === 'card' && (
                    <div className="mb-4 md:mb-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Card Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                          <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardData.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                              const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                              setCardData({ ...cardData, cardNumber: formatted })
                            }}
                            maxLength={19}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardData.cardName}
                            onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardData.expiryDate}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '')
                                const formatted = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2, 4)}` : value
                                setCardData({ ...cardData, expiryDate: formatted })
                              }}
                              maxLength={5}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              placeholder="123"
                              value={cardData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                                setCardData({ ...cardData, cvv: value })
                              }}
                              maxLength={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="mb-4 md:mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Cash on Delivery</h3>
                            <p className="text-sm text-gray-600">
                              You will pay {formatCurrency(getCartTotal())} when you receive your order. 
                              Our delivery team will collect the payment at your doorstep.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cash on Delivery Form */}
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={cashOnDeliveryData.name}
                              onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, name: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                              placeholder="Enter your full name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={cashOnDeliveryData.phone}
                              onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, phone: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                              placeholder="Enter your phone number"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Street Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={cashOnDeliveryData.street}
                              onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, street: e.target.value })}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                              placeholder="Enter street address"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cashOnDeliveryData.city}
                                onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, city: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                                placeholder="Enter city"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                State/Province <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cashOnDeliveryData.state}
                                onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, state: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                                placeholder="Enter state/province"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP/Postal Code <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cashOnDeliveryData.zipCode}
                                onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, zipCode: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                                placeholder="Enter ZIP/postal code"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={cashOnDeliveryData.country}
                                onChange={(e) => setCashOnDeliveryData({ ...cashOnDeliveryData, country: e.target.value })}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                                placeholder="Enter country"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {user.address && (
                    <div className="mb-4 md:mb-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{t('shippingAddress') || 'Shipping Address'}</h3>
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4 text-xs md:text-sm text-gray-700">
                        {user.address.street && <p>{user.address.street}</p>}
                        <p>
                          {user.address.city && `${user.address.city}, `}
                          {user.address.state && `${user.address.state} `}
                          {user.address.zipCode && `${user.address.zipCode}`}
                        </p>
                        {user.address.country && <p>{user.address.country}</p>}
                      </div>
                    </div>
                  )}

                  {/* Complete Payment Button */}
                  <button
                    onClick={handleCompletePayment}
                    disabled={processing}
                    className="w-full bg-[#FF385C] hover:bg-[#E61E4D] disabled:bg-gray-400 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none text-sm md:text-base"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {paymentMethod === 'cash' ? 'Placing Order...' : 'Processing Payment...'}
                      </span>
                    ) : (
                      paymentMethod === 'cash' 
                        ? `Complete Order - ${formatCurrency(getCartTotal())}`
                        : `Pay ${formatCurrency(getCartTotal())}`
                    )}
                  </button>
                </div>
              </>
            ) : checkoutStep === 3 ? (
              <>
                {/* Step 3: Success Message */}
                <div className="p-4 md:p-8 text-center">
                  <div className="mb-4 md:mb-6">
                    <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mb-3 md:mb-4">
                      <svg className="w-10 h-10 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
                    <p className="text-base md:text-lg text-gray-600 mb-1">Thank you for your purchase</p>
                    {orderDetails && (
                      <p className="text-xs md:text-sm text-gray-500">Order ID: #{orderDetails._id.slice(-8).toUpperCase()}</p>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-blue-100">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">What's Next?</h3>
                        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                          We've received your order and our team will contact you as soon as possible to confirm the details and arrange delivery. 
                          You'll receive an email confirmation shortly with your order information.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-4 md:mb-6 text-left">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3 md:mb-4">Order Summary</h3>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(orderDetails?.totalAmount || getCartTotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="font-medium text-gray-900 capitalize">{paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Status</span>
                        <span className="font-medium text-green-600 capitalize">{orderDetails?.orderStatus || 'Processing'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button
                      onClick={handleContinueShopping}
                      className="flex-1 bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] text-sm md:text-base"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={() => {
                        setShowCheckoutModal(false)
                        setOrderPlaced(false)
                        setOrderDetails(null)
                        navigate('/profile')
                      }}
                      className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all duration-200 hover:bg-gray-50 text-sm md:text-base"
                    >
                      View Orders
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart

