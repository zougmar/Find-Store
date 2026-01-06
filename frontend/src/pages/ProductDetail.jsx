import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, getFinalPrice } = useCart()
  const { user } = useAuth()
  const { t, isRTL } = useLanguage()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Calculate discounted price
  const discountPercentage = product?.discountPercentage || 0
  const originalPrice = product?.price || 0
  const discountedPrice = discountPercentage > 0 
    ? originalPrice * (1 - discountPercentage / 100) 
    : originalPrice
  const hasDiscount = discountPercentage > 0

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`)
      setProduct(res.data)
    } catch (error) {
      toast.error(t('noProductsFound') || 'Product not found')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      toast.error(t('outOfStock') || 'Insufficient stock')
      return
    }
    addToCart(product, quantity)
    toast.success(t('addedToCart') || 'Added to cart!', {
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
      },
      iconTheme: {
        primary: '#ffffff',
        secondary: '#10b981'
      }
    })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error(t('pleaseLoginReview') || 'Please login to submit a review')
      return
    }

    try {
      await api.post(`/products/${id}/reviews`, review)
      toast.success(t('reviewSubmitted') || 'Review submitted!')
      setReview({ rating: 5, comment: '' })
      fetchProduct()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8">
          {/* Product Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <div>
                {/* Main Image - Professional Styling */}
                <div className="mb-6 relative group">
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
                    <div className="aspect-square w-full">
                      <img
                        src={product.images[selectedImageIndex]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/800x800?text=No+Image'
                        }}
                      />
                    </div>
                    {/* Overlay gradient for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                  </div>
                  
                  {/* Image counter badge */}
                  {product.images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-sm font-semibold text-gray-700">
                      {selectedImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Images - Enhanced Styling */}
                {product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-md hover:shadow-lg ${
                          selectedImageIndex === index
                            ? 'border-[#FF385C] ring-4 ring-[#FF385C]/30 scale-105'
                            : 'border-gray-200 hover:border-[#FF385C]/50'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/96?text=Error'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 shadow-inner border border-gray-200">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">{t('noProductsFound') || 'No Image Available'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">{product.name}</h1>
            <div className="flex items-center mb-3 md:mb-4">
              <span className="text-yellow-500 text-xl md:text-2xl">★</span>
              <span className="text-base md:text-xl text-gray-700 ml-2">
                {product.averageRating || 0} ({product.numReviews || 0} {t('reviews') || 'reviews'})
              </span>
            </div>
            {/* Price with Discount */}
            <div className="mb-4 md:mb-6">
              {hasDiscount ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl md:text-3xl font-bold text-blue-600">
                      {formatCurrency(discountedPrice)}
                    </span>
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                      -{discountPercentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(originalPrice)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {t('youSave') || 'You save'} {formatCurrency(originalPrice - discountedPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-blue-600">
                  {formatCurrency(originalPrice)}
                </p>
              )}
            </div>
            <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6">{product.description}</p>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">{t('category')}:</span> {product.category}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{t('stock')}:</span> {product.stock} {t('available')}
              </p>
            </div>

            {product.stock > 0 ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('quantity')}
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-red-500 font-semibold mb-6">{t('outOfStockLabel') || 'Out of Stock'}</p>
            )}

            <div className="space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {t('addToCartButton') || t('addToCart')}
            </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">{t('customerReviews') || t('reviews')}</h2>
          
          {/* Add Review Form */}
          {user && (
            <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">{t('writeReview')}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('yourRating') || t('rating')}
                </label>
                <select
                  value={review.rating}
                  onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('yourComment') || 'Comment'}
                </label>
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                {t('submitReview')}
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {product.ratings && product.ratings.length > 0 ? (
              product.ratings.map((rating, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-2 font-semibold">{rating.rating}/5</span>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-700">{rating.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">{t('noReviews')}. {t('beFirstReview')}!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
