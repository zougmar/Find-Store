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

  const handleAddToCart = () => {
    if (product.stock < quantity) {
      toast.error(t('outOfStock') || 'Insufficient stock')
      return
    }
    addToCart(product, quantity)
    if (user) {
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
    // Guest: CartContext will open the order details form modal
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
      <section className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/50 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Product Image Hero */}
            <div className={`relative ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
              {product.images && product.images.length > 0 ? (
                <div className="relative group">
                  <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm shadow-2xl border border-white/10 p-6">
                    <div className="aspect-square w-full max-w-lg mx-auto bg-white/5 rounded-xl overflow-hidden">
                      <img
                        src={product.images[selectedImageIndex]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/800x800?text=No+Image'
                        }}
                      />
                    </div>
                    {/* Floating badges */}
                    {hasDiscount && (
                      <div className={`absolute top-8 ${isRTL ? 'right-8' : 'left-8'} bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-2xl backdrop-blur-sm border border-white/20`}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                          </svg>
                          {discountPercentage}% {t('save')}
                        </span>
                      </div>
                    )}
                    {product.stock > 0 && (
                      <div className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-2xl backdrop-blur-sm border border-white/20`}>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {t('inStockLabel')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image thumbnails for hero */}
                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-3 mt-6 justify-center">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                            selectedImageIndex === index
                              ? 'border-white ring-2 ring-white/30 scale-105 shadow-xl'
                              : 'border-white/20 hover:border-white/40 opacity-70 hover:opacity-100'
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
                <div className="w-full max-w-lg mx-auto aspect-square bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-white/50 font-medium text-sm">{t('noImageAvailable')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hero Content */}
            <div className={`${isRTL ? 'text-right lg:order-1' : 'text-center lg:text-left lg:order-2'} space-y-6`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-medium text-white/90 border border-white/20 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>{product.category}</span>
                {product.subcategory && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{product.subcategory}</span>
                  </>
                )}
              </div>
              
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight ${isRTL ? 'text-right font-semibold' : ''}`} lang={isRTL ? 'ar' : language}>
                  {product.name}
                </h1>
                <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-center lg:justify-start'} gap-3 mb-6`}>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-xl ${i < Math.floor(product.averageRating || 0) ? 'text-amber-400' : 'text-white/20'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-base font-semibold text-white/90">
                    {product.averageRating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-white/60">
                    ({product.numReviews || 0} {t('reviews') || 'reviews'})
                  </span>
                </div>
              </div>
              
              {/* Price Section */}
              <div className={`space-y-3 ${isRTL ? 'text-right' : ''}`}>
                {hasDiscount ? (
                  <div className="space-y-2">
                    <div className={`flex items-baseline ${isRTL ? 'justify-end' : 'justify-center lg:justify-start'} gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-5xl md:text-6xl font-bold tracking-tight">
                        {formatCurrency(discountedPrice)}
                      </span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold rounded-lg shadow-lg">
                        {t('save')} {discountPercentage}%
                      </span>
                    </div>
                    <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-center lg:justify-start'} gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-2xl text-white/50 line-through font-medium">
                        {formatCurrency(originalPrice)}
                      </span>
                      <span className="text-sm text-white/70 font-medium">
                        {t('youSaveAmount')} {formatCurrency(originalPrice - discountedPrice)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-5xl md:text-6xl font-bold tracking-tight ${isRTL ? 'text-right' : ''}`}>
                    {formatCurrency(originalPrice)}
                  </p>
                )}
              </div>

              {/* Stock & Quantity */}
              {product.stock > 0 && (
                <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">{t('quantity') || 'Quantity'}</span>
                    <span className="text-xs text-white/60 font-medium">{t('stock') || 'Stock'}: {product.stock} {t('available') || 'available'}</span>
                  </div>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105"
                    >
                      −
                    </button>
                    <span className="text-2xl font-bold text-white min-w-[3rem] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-3 pt-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-white text-slate-900 hover:bg-gray-50 disabled:bg-slate-700 disabled:text-slate-400 font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-xl text-base"
                >
                  {product.stock > 0 ? (t('addToCartButton') || t('addToCart')) : (t('outOfStockLabel') || 'Out of Stock')}
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
        </div>
      </section>

      {/* Product Description Section */}
      <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 md:p-12">
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-8 border-b-2 border-gray-100 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'font-semibold' : ''}`}>{t('productOverview')}</h2>
                  <p className={`text-gray-600 text-base md:text-lg ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'leading-relaxed' : ''}`}>{t('productOverviewSubtitle') || 'Detailed information about this product'}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className={`p-8 bg-gradient-to-br ${isRTL ? 'from-gray-50 to-gray-100/50' : 'from-gray-50 to-gray-100/50'} rounded-xl border-2 border-gray-200 hover:border-[#FF385C]/30 transition-all duration-300 shadow-sm`}>
                  <p className={`text-gray-700 leading-relaxed whitespace-pre-line text-base md:text-lg ${isRTL ? 'text-right font-medium' : 'text-left'} ${isRTL ? 'leading-loose' : ''}`} dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : language}>
                    {product.description || t('noImageAvailable')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Capture Form */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 md:p-7">
              <h3 className={`text-xl font-bold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar'
                  ? 'أرسل معلوماتك وسنتواصل معك'
                  : language === 'fr'
                  ? 'Envoyez vos informations et nous vous contacterons'
                  : 'Send your info and we will contact you'}
              </h3>
              <p className={`text-sm text-gray-600 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar'
                  ? 'املأ هذه الخانات وسنتواصل معك عبر الهاتف أو واتساب لتأكيد الطلب.'
                  : language === 'fr'
                  ? 'Remplissez ces champs et nous vous contacterons par téléphone ou WhatsApp pour confirmer la commande.'
                  : 'Fill in these fields and we will contact you by phone or WhatsApp to confirm your order.'}
              </p>

              <form onSubmit={handleSubmitLead} className={isRTL ? 'text-right' : 'text-left'}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'الاسم الكامل*' : language === 'fr' ? 'Nom complet*' : 'Full name*'}
                    </label>
                    <input
                      type="text"
                      value={lead.fullName}
                      onChange={(e) => setLead({ ...lead, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'رقم الهاتف*' : language === 'fr' ? 'Numéro de téléphone*' : 'Phone number*'}
                    </label>
                    <input
                      type="tel"
                      value={lead.phone}
                      onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="+212..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'المدينة*' : language === 'fr' ? 'Ville*' : 'City*'}
                    </label>
                    <input
                      type="text"
                      value={lead.city}
                      onChange={(e) => setLead({ ...lead, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'العنوان الكامل*' : language === 'fr' ? 'Adresse complète*' : 'Full address*'}
                    </label>
                    <textarea
                      rows="2"
                      value={lead.address}
                      onChange={(e) => setLead({ ...lead, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'ar' ? 'ملاحظة (اختياري)' : language === 'fr' ? 'Note (optionnel)' : 'Note (optional)'}
                    </label>
                    <textarea
                      rows="2"
                      value={lead.note}
                      onChange={(e) => setLead({ ...lead, note: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingLead}
                  className="mt-5 w-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold py-2.5 rounded-lg text-sm shadow-md transition-colors disabled:opacity-60"
                >
                  {submittingLead
                    ? language === 'ar'
                      ? 'جاري الإرسال...'
                      : language === 'fr'
                      ? 'Envoi...'
                      : 'Sending...'
                    : language === 'ar'
                    ? 'إرسال المعلومات'
                    : language === 'fr'
                    ? 'Envoyer les informations'
                    : 'Send information'}
                </button>
              </form>
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
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-white text-slate-900 hover:bg-gray-50 disabled:bg-slate-700 disabled:text-slate-400 font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-xl text-base"
              >
                {product.stock > 0 ? (t('addToCartButton') || t('addToCart')) : (t('outOfStockLabel') || 'Out of Stock')}
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
