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
   
return (
  <div
    className="min-h-screen bg-white text-gray-900"
    dir={isRTL ? 'rtl' : 'ltr'}
    lang={language}
  >
    {/* HERO / PRODUCT DETAILS */}
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* PRODUCT GALLERY */}
          <div className="lg:sticky lg:top-8">
            <div className="relative bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
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
                <span className="absolute top-5 left-5 bg-[#FF385C] text-white text-sm font-bold px-4 py-2 rounded-full shadow-sm">
                  -{discountPercentage}%
                </span>
              )}

              {product.stock > 0 && (
                <span className="absolute bottom-5 left-5 bg-white text-green-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
                  ● {t('inStockLabel')}
                </span>
              )}
            </div>

            {/* THUMBNAILS */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${
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

          {/* PRODUCT INFORMATION */}
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#FF385C] bg-rose-50 px-3 py-2 rounded-full">
                {product.category}
              </span>
              {product.subcategory && (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
                  {product.subcategory}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* RATING */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-400 tracking-wider text-lg">
                {'★'.repeat(Math.min(5, Math.max(0, Math.floor(product.averageRating || 0))))}
                <span className="text-gray-200">
                  {'★'.repeat(5 - Math.min(5, Math.max(0, Math.floor(product.averageRating || 0))))}
                </span>
              </span>
              <span className="font-semibold">
                {product.averageRating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-gray-500">
                ({product.numReviews || 0} {t('reviews')})
              </span>
            </div>

            {/* DESCRIPTION */}
            {product.description && (
              <p className="text-gray-600 leading-7 text-base">
                {product.description}
              </p>
            )}

            {/* PRICE */}
            <div className="border-y border-gray-100 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl md:text-4xl font-bold">
                  {formatCurrency(discountedPrice)}
                </span>

                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(originalPrice)}
                    </span>
                    <span className="bg-rose-50 text-[#FF385C] text-xs font-bold px-3 py-2 rounded-full">
                      -{discountPercentage}%
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

            {/* QUANTITY */}
            {product.stock > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">
                    {t('quantity')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.stock} {t('available')}
                  </p>
                </div>

                <div className="flex items-center gap-4 border border-gray-200 rounded-full p-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-full hover:bg-gray-100 font-semibold"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="font-bold min-w-5 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-9 h-9 rounded-full hover:bg-gray-100 font-semibold"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* PURCHASE BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-bold py-4 px-5 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock > 0
                  ? t('buyNow') || 'Buy now'
                  : t('outOfStockLabel') || 'Out of Stock'}
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-4 px-5 rounded-xl transition-colors"
              >
                {t('contactViaWhatsApp')}
              </button>
            </div>

            {/* TRUST INFORMATION */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-sm">
                  ✓ {language === 'ar' ? 'طلب سهل' : language === 'fr' ? 'Commande facile' : 'Easy ordering'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'ar' ? 'معلومات بسيطة لإرسال الطلب' : language === 'fr' ? 'Commande en quelques étapes' : 'Simple order process'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-sm">
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

    {/* DESCRIPTION AND ORDER FORM */}
    <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 md:p-9">
            <p className="text-sm font-semibold text-[#FF385C] mb-2">
              {t('productOverview')}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-5">
              {t('productOverviewSubtitle') || 'Discover the product'}
            </h2>
            <div className="text-gray-600 leading-8 whitespace-pre-line">
              {product.description || t('noImageAvailable')}
            </div>
          </div>

          {/* ORDER FORM */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7 shadow-sm">
            <h3 className="text-xl font-bold mb-2">
              {language === 'ar'
                ? 'اطلب الآن'
                : language === 'fr'
                ? 'Commander maintenant'
                : 'Order now'}
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              {language === 'ar'
                ? 'أدخل معلوماتك وسنتصل بك لتأكيد الطلب.'
                : language === 'fr'
                ? 'Entrez vos informations pour confirmer votre commande.'
                : 'Enter your details and we will contact you to confirm your order.'}
            </p>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              {[
                {
                  key: 'fullName',
                  type: 'text',
                  label: language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Nom complet' : 'Full name',
                  placeholder: language === 'ar' ? 'أدخل اسمك الكامل' : language === 'fr' ? 'Votre nom complet' : 'Your full name'
                },
                {
                  key: 'phone',
                  type: 'tel',
                  label: language === 'ar' ? 'رقم الهاتف' : language === 'fr' ? 'Téléphone' : 'Phone number',
                  placeholder: '+212...'
                },
                {
                  key: 'city',
                  type: 'text',
                  label: language === 'ar' ? 'المدينة' : language === 'fr' ? 'Ville' : 'City',
                  placeholder: language === 'ar' ? 'مدينتك' : language === 'fr' ? 'Votre ville' : 'Your city'
                }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} *
                  </label>
                  <input
                    type={field.type}
                    required
                    value={lead[field.key]}
                    onChange={(e) =>
                      setLead({ ...lead, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF385C] focus:ring-2 focus:ring-rose-100 transition"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'العنوان الكامل' : language === 'fr' ? 'Adresse complète' : 'Full address'} *
                </label>
                <textarea
                  required
                  rows={2}
                  value={lead.address}
                  onChange={(e) =>
                    setLead({ ...lead, address: e.target.value })
                  }
                  placeholder={language === 'ar' ? 'أدخل عنوانك' : language === 'fr' ? 'Votre adresse' : 'Your full address'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF385C] focus:ring-2 focus:ring-rose-100 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'ملاحظة (اختياري)' : language === 'fr' ? 'Note (facultatif)' : 'Note (optional)'}
                </label>
                <textarea
                  rows={2}
                  value={lead.note}
                  onChange={(e) =>
                    setLead({ ...lead, note: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF385C] focus:ring-2 focus:ring-rose-100 resize-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={submittingLead}
                className="w-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60"
              >
                {submittingLead
                  ? language === 'ar'
                    ? 'جاري الإرسال...'
                    : language === 'fr'
                    ? 'Envoi...'
                    : 'Sending...'
                  : language === 'ar'
                  ? 'تأكيد الطلب'
                  : language === 'fr'
                  ? 'Envoyer ma commande'
                  : 'Submit order'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    {product.features?.length > 0 && (
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <p className="text-sm font-semibold text-[#FF385C] mb-2">
              {t('productFeatures') || 'Product features'}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              {t('productFeaturesSubtitle') || 'Why choose this product?'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {product.features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-rose-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-[#FF385C] font-bold mb-4">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <p className="text-gray-700 leading-7">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )}

    {/* CUSTOMER REVIEWS */}
    <section className="bg-gray-50 border-y border-gray-100 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-9">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-gray-100 pb-6 mb-8">
            <div>
              <p className="text-sm font-semibold text-[#FF385C] mb-2">
                {t('customerReviews') || 'Customer reviews'}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('seeWhatCustomersSaying')}
              </h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold">
                {product.averageRating?.toFixed(1) || '0.0'}
                <span className="text-amber-400 ml-2">★</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {product.numReviews || 0} {t('reviews')}
              </p>
            </div>
          </div>

          {/* REVIEW FORM */}
          {user && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-gray-50 rounded-2xl p-5 md:p-7 mb-8"
            >
              <h3 className="text-lg font-bold mb-5">
                {t('writeReview') || 'Write a review'}
              </h3>

              <label className="block text-sm font-medium mb-2">
                {t('yourRating') || 'Your rating'}
              </label>
              <select
                value={review.rating}
                onChange={(e) =>
                  setReview({ ...review, rating: Number(e.target.value) })
                }
                className="w-full sm:w-64 p-3 bg-white border border-gray-200 rounded-xl mb-5 outline-none focus:border-[#FF385C]"
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very Good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Fair</option>
                <option value={1}>1 - Poor</option>
              </select>

              <label className="block text-sm font-medium mb-2">
                {t('yourComment') || 'Your comment'}
              </label>
              <textarea
                required
                rows={4}
                value={review.comment}
                onChange={(e) =>
                  setReview({ ...review, comment: e.target.value })
                }
                placeholder={t('shareYourExperience')}
                className="w-full p-4 bg-white border border-gray-200 rounded-xl mb-5 outline-none focus:border-[#FF385C] resize-none"
              />

              <button
                type="submit"
                className="bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold px-7 py-3 rounded-xl transition-colors"
              >
                {t('submitReview') || 'Submit review'}
              </button>
            </form>
          )}

          {/* EXISTING REVIEWS */}
          <div className="space-y-4">
            {product.ratings?.length > 0 ? (
              product.ratings.map((rating, index) => (
                <article
                  key={rating._id || index}
                  className="border border-gray-100 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-rose-50 text-[#FF385C] flex items-center justify-center font-bold">
                        {rating.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {rating.user?.name || t('anonymousUser')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(rating.createdAt).toLocaleDateString(
                            language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="text-amber-400 whitespace-nowrap">
                      {'★'.repeat(Math.min(5, Math.max(0, rating.rating || 0)))}
                      <span className="text-gray-200">
                        {'★'.repeat(5 - Math.min(5, Math.max(0, rating.rating || 0)))}
                      </span>
                    </span>
                  </div>

                  {rating.comment && (
                    <p className="text-gray-600 leading-7 mt-4">
                      {rating.comment}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-300 mb-4">☆</div>
                <p className="font-semibold text-gray-700">
                  {t('noReviews') || 'No reviews yet'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {t('beFirstReview') || 'Be the first to review this product!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* FINAL CTA */}
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 text-center">
          <p className="text-sm font-semibold text-rose-300 mb-3">
            FINDSTORE
          </p>

          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            {t('readyToMakePurchase')}
          </h2>

          <p className="text-gray-300 max-w-xl mx-auto mb-8 leading-7">
            {t('dontMissOut')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="bg-[#FF385C] hover:bg-[#E61E4D] disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              {product.stock > 0
                ? t('buyNow') || 'Buy now'
                : t('outOfStockLabel') || 'Out of Stock'}
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
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
