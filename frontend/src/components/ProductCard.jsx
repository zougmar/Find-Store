import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const ProductCard = ({ product }) => {
  const { toggleFavorite, isFavorited } = useFavorites()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { t, isRTL } = useLanguage()
  const favorited = isFavorited(product._id)

  // Calculate discounted price
  const discountPercentage = product.discountPercentage || 0
  const originalPrice = product.price
  const discountedPrice = discountPercentage > 0 
    ? originalPrice * (1 - discountPercentage / 100) 
    : originalPrice
  const hasDiscount = discountPercentage > 0

  const handleFavoriteClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleFavorite(product._id)
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (product.stock <= 0) {
      toast.error(t('outOfStock') || 'Product is out of stock')
      return
    }
    
    addToCart(product, 1)
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

  return (
    <Link
      to={`/product/${product._id}`}
      className="block group"
    >
      <div className="relative">
        {/* Image Container */}
        <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-xl md:rounded-2xl overflow-hidden bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
                -{discountPercentage}%
              </span>
            </div>
          )}
          
          {/* Subcategory Badge */}
          {product.subcategory && product.subcategory.trim() !== '' && (
            <div className={`absolute ${hasDiscount ? 'top-12' : 'top-3'} left-3 z-10`}>
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-900 shadow-sm border border-gray-200/50">
                {product.subcategory}
              </span>
            </div>
          )}
          
          {/* Heart icon (like Airbnb favorites) */}
          {user && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors z-10 shadow-sm"
            >
              <svg 
                className={`w-5 h-5 transition-colors ${favorited ? 'fill-[#FF385C] text-[#FF385C]' : 'text-gray-700'}`} 
                fill={favorited ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
          
          {/* Add to Cart Button - Shows on hover (desktop) and always visible (mobile) */}
          <div className="absolute bottom-3 left-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`w-full py-2.5 px-4 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg ${
                product.stock > 0
                  ? 'bg-[#FF385C] hover:bg-[#E61E4D] active:bg-[#D91A47] text-white hover:shadow-xl active:scale-95'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('addToCart')}
                </span>
              ) : (
                'Out of Stock'
              )}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {product.category}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 fill-current text-black" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                {product.averageRating ? Number(product.averageRating).toFixed(1) : 'New'}
              </span>
              {product.numReviews > 0 && (
                <span className="text-sm text-gray-500">
                  ({product.numReviews})
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end gap-1">
                {hasDiscount ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(discountedPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(originalPrice)}
                      </span>
                      <span className="text-xs font-semibold text-red-500">
                        -{discountPercentage}%
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[15px] font-semibold text-gray-900">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                {product.stock > 0 ? (
                  <span className="text-xs text-gray-500">available</span>
                ) : (
                  <span className="text-xs text-red-500">sold out</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
