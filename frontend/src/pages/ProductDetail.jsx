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
  const { openBuyNow, getFinalPrice } = useCart()
  const { user } = useAuth()
  const { t, isRTL, language } = useLanguage()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lead, setLead] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    note: ''
  })
  const [submittingLead, setSubmittingLead] = useState(false)

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

  const handleBuyNow = () => {
    if (product.stock < quantity) {
      toast.error(t('outOfStock') || 'Insufficient stock')
      return
    }
    openBuyNow(product, quantity)
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

  const handleWhatsApp = () => {
    // WhatsApp phone number - you can change this to your store's WhatsApp number
    // Format: country code + number (without + or spaces)
    const whatsappPhone = '212707625535' // Default from Contact page, can be made configurable
    
    // Get current page URL for product link
    const productUrl = window.location.href
    
    // Build the message based on language
    let message = ''
    if (language === 'ar') {
      // Arabic message
      message = `مرحبا! 👋

أنا مهتم بهذا المنتج:

📦 *${product.name}*

💰 السعر: ${hasDiscount ? formatCurrency(discountedPrice) : formatCurrency(originalPrice)}${hasDiscount ? ` (كان ${formatCurrency(originalPrice)}، وفر ${discountPercentage}%!)` : ''}

📝 الوصف: ${product.description || t('noImageAvailable')}

🏷️ ${t('category')}: ${product.category || t('noImageAvailable')}
${product.subcategory ? `📂 ${product.subcategory}\n` : ''}
📊 ${t('stock')}: ${product.stock > 0 ? `${product.stock} ${t('available')}` : t('outOfStockLabel')}

🔗 ${productUrl}

أود معرفة المزيد عن هذا المنتج. هل يمكنك مساعدتي؟`
    } else if (language === 'fr') {
      // French message
      message = `Bonjour! 👋

Je suis intéressé(e) par ce produit:

📦 *${product.name}*

💰 Prix: ${hasDiscount ? formatCurrency(discountedPrice) : formatCurrency(originalPrice)}${hasDiscount ? ` (était ${formatCurrency(originalPrice)}, économisez ${discountPercentage}%!)` : ''}

📝 Description: ${product.description || t('noImageAvailable')}

🏷️ ${t('category')}: ${product.category || t('noImageAvailable')}
${product.subcategory ? `📂 ${product.subcategory}\n` : ''}
📊 Stock: ${product.stock > 0 ? `${product.stock} ${t('available')}` : t('outOfStockLabel')}

🔗 Lien du produit: ${productUrl}

J'aimerais en savoir plus sur ce produit. Pouvez-vous m'aider?`
    } else {
      // English message
      message = `Hello! 👋

I'm interested in this product:

📦 *${product.name}*

💰 Price: ${hasDiscount ? formatCurrency(discountedPrice) : formatCurrency(originalPrice)}${hasDiscount ? ` (was ${formatCurrency(originalPrice)}, save ${discountPercentage}%!)` : ''}

📝 Description: ${product.description || t('noImageAvailable')}

🏷️ ${t('category')}: ${product.category || t('noImageAvailable')}
${product.subcategory ? `📂 ${product.subcategory}\n` : ''}
📊 ${t('stock')}: ${product.stock > 0 ? `${product.stock} ${t('available')}` : t('outOfStockLabel')}

🔗 Product link: ${productUrl}

I would like to know more about this product. Can you help me?`
    }

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`
    
    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank')
    
    toast.success(language === 'ar' ? 'جاري فتح واتساب...' : (language === 'fr' ? 'Ouverture de WhatsApp...' : 'Opening WhatsApp...'), {
      icon: '💬',
      duration: 2000
    })
  }

  const handleSubmitLead = async (e) => {
    e.preventDefault()

    if (!product?._id) {
      toast.error('Product not found')
      return
    }

    if (!lead.fullName || !lead.phone || !lead.city || !lead.address) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setSubmittingLead(true)
      await api.post('/product-inquiries', {
        productId: product._id,
        fullName: lead.fullName,
        phone: lead.phone,
        city: lead.city,
        address: lead.address,
        note: lead.note
      })
      toast.success('Your information has been sent. We will contact you soon.')
      setLead({
        fullName: '',
        phone: '',
        city: '',
        address: '',
        note: ''
      })
    } catch (error) {
      console.error('Error sending lead:', error)
      toast.error(error.response?.data?.message || 'Failed to send your request')
    } finally {
      setSubmittingLead(false)
    }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-gray-600 font-medium mt-6 text-lg">{t('loadingProduct')}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
      {/* Hero Section */}
    
{/* Modern Product Hero — replace your existing Hero Section */}
<section
  className="bg-white text-gray-900"
  dir={isRTL ? 'rtl' : 'ltr'}
  lang={language}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

      {/* Product Gallery */}
      <div className="min-w-0">
        <div className="relative bg-gray-50 rounded-3xl overflow-hidden">
          {product.images?.length > 0 ? (
            <img
              src={product.images[selectedImageIndex]}
              alt={product.name}
              className="w-full aspect-square object-contain p-5 md:p-10"
              onError={(e) => {
                e.currentTarget.src =
                  'https://via.placeholder.com/800x800?text=Product'
              }}
            />
          ) : (
            <div className="aspect-square flex items-center justify-center text-gray-400">
              {t('noImageAvailable')}
            </div>
          )}

          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-[#FF385C] text-white text-sm font-bold px-4 py-2 rounded-full">
              -{discountPercentage}%
            </span>
          )}

          {product.stock > 0 && (
            <span className="absolute bottom-4 left-4 bg-white text-green-700 text-xs font-semibold px-3 py-2 rounded-full shadow-sm">
              ✓ {t('inStockLabel')}
            </span>
          )}
        </div>

        {product.images?.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                aria-label={`View product image ${index + 1}`}
                className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 ${
                  selectedImageIndex === index
                    ? 'border-[#FF385C]'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FF385C] bg-rose-50 px-3 py-2 rounded-full">
            {product.category}
          </span>
          {product.subcategory && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
              {product.subcategory}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          {product.name}
        </h1>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-500 tracking-wider">★★★★★</span>
          <span className="font-semibold">
            {product.averageRating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-gray-500">
            ({product.numReviews || 0} {t('reviews')})
          </span>
        </div>

        {product.description && (
          <p className="text-gray-600 leading-7 line-clamp-4">
            {product.description}
          </p>
        )}

        <div className="border-y border-gray-100 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              {formatCurrency(discountedPrice)}
            </span>

            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
                <span className="bg-rose-50 text-[#FF385C] text-xs font-bold px-3 py-2 rounded-full">
                  {t('save')} {discountPercentage}%
                </span>
              </>
            )}
          </div>

          {hasDiscount && (
            <p className="text-sm text-green-700 mt-2">
              {t('youSaveAmount')} {formatCurrency(originalPrice - discountedPrice)}
            </p>
          )}
        </div>

        {product.stock > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700">
              {t('quantity')}
            </span>
            <div className="flex items-center gap-4 border border-gray-200 rounded-full px-3 py-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full hover:bg-gray-100 font-semibold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="font-semibold min-w-5 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-8 h-8 rounded-full hover:bg-gray-100 font-semibold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
            className="w-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {product.stock > 0
              ? t('buyNow') || 'Buy now'
              : t('outOfStockLabel') || 'Out of Stock'}
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold py-4 px-5 rounded-xl transition-colors"
          >
            {t('contactViaWhatsApp')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800">
              ✓ {language === 'ar' ? 'طلب سهل' : language === 'fr' ? 'Commande facile' : 'Easy ordering'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' ? 'معلومات بسيطة لإرسال الطلب' : language === 'fr' ? 'Informations simples' : 'Simple order form'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-800">
              ✓ WhatsApp
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' ? 'تواصل معنا بسهولة' : language === 'fr' ? 'Contactez-nous facilement' : 'Contact us directly'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Product Features Section */}
      {product.features && product.features.length > 0 && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12">
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-8 border-b-2 border-gray-100 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-semibold' : ''}`}>{t('productFeatures') || 'Product Features'}</h2>
                <p className={`text-gray-600 text-base md:text-lg ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'leading-relaxed' : ''}`}>{t('productFeaturesSubtitle') || 'Key features and benefits of this product'}</p>
              </div>
            </div>
            <div className="space-y-6">
              {product.features.map((feature, index) => (
                <div key={index} className={`p-6 md:p-8 bg-gradient-to-br ${isRTL ? 'from-gray-50 to-gray-100/50' : 'from-gray-50 to-gray-100/50'} rounded-xl border-2 border-gray-200 hover:border-[#FF385C]/30 transition-all duration-300 shadow-sm hover:shadow-md`}>
                  <div className={`flex items-start gap-4 md:gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#FF385C] to-[#FF6B8A] rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg ${isRTL ? 'ml-4' : 'mr-0'}`}>
                      {index + 1}
                    </div>
                    <p className={`text-gray-700 leading-relaxed text-base md:text-lg flex-1 ${isRTL ? 'text-right font-medium' : 'text-left'} ${isRTL ? 'leading-loose' : ''}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
                      {feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-8 border-b-2 border-gray-100 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-semibold' : ''}`}>{t('customerReviews') || t('reviews') || 'Customer Reviews'}</h2>
              <p className={`text-gray-600 text-base md:text-lg ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'leading-relaxed' : ''}`}>{t('seeWhatCustomersSaying')}</p>
            </div>
            <div className={`flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-xl border border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < Math.floor(product.averageRating || 0) ? 'text-amber-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <div className={isRTL ? 'mr-2' : 'ml-2'}>
                <span className="text-2xl font-bold text-gray-900 block leading-none">
                  {product.averageRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {product.numReviews || 0} {t('reviews')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Add Review Form */}
          {user && (
            <form onSubmit={handleSubmitReview} className={`mb-12 p-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t('writeReview') || 'Write a Review'}</h3>
              <div className="mb-6">
                <label className={`block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('yourRating') || t('rating') || 'Your Rating'}
                </label>
                <select
                  value={review.rating}
                  onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                  className={`w-full max-w-xs px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <option value={5}>{t('ratingExcellent') || '5 - Excellent'}</option>
                  <option value={4}>{t('ratingVeryGood') || '4 - Very Good'}</option>
                  <option value={3}>{t('ratingGood') || '3 - Good'}</option>
                  <option value={2}>{t('ratingFair') || '2 - Fair'}</option>
                  <option value={1}>{t('ratingPoor') || '1 - Poor'}</option>
                </select>
              </div>
              <div className="mb-6">
                <label className={`block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('yourComment') || t('comment') || 'Your Comment'}
                </label>
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })}
                  rows="5"
                  className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('shareYourExperience')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {t('submitReview') || 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {product.ratings && product.ratings.length > 0 ? (
              product.ratings.map((rating, index) => (
                <div key={index} className={`p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
                  <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {rating.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{rating.user?.name || t('anonymousUser')}</p>
                        <p className="text-sm text-gray-500 font-medium">{new Date(rating.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US'), { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < rating.rating ? 'text-amber-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className={`text-gray-700 leading-relaxed ${isRTL ? 'pr-16 text-right font-medium leading-loose' : 'pl-16 text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>{rating.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">{t('noReviews') || 'No reviews yet'}</p>
                <p className="text-gray-500">{t('beFirstReview') || 'Be the first to review this product!'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className={`bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 md:p-12 ${isRTL ? 'text-right' : 'text-center'} text-white`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isRTL ? 'text-right' : 'text-center'} ${isRTL ? 'font-semibold' : ''}`}>{t('readyToMakePurchase')}</h2>
            <p className={`text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed ${isRTL ? 'text-right' : 'text-center'} ${isRTL ? 'leading-loose' : ''}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
              {t('dontMissOut')}
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 bg-white text-slate-900 hover:bg-gray-50 disabled:bg-slate-700 disabled:text-slate-400 font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-xl text-base"
              >
                {product.stock > 0 ? (t('buyNow') || 'Buy now') : (t('outOfStockLabel') || 'Out of Stock')}
              </button>
              <button
                onClick={handleWhatsApp}
                className={`flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-xl text-base flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {t('contactViaWhatsApp')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductDetail
