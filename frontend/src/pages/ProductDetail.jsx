import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'
import { getUnitPrice, isVideoUrl } from '../utils/product'
import { normalizeMoroccanPhone } from '../utils/phone'
import usePageMeta from '../hooks/usePageMeta'
import { notifyAdminChange } from '../utils/adminSync'

const WHATSAPP_PHONE = '212707625535'

const ProductDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { openBuyNow } = useCart()
  const { user } = useAuth()
  const { t, isRTL, language } = useLanguage()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [orderForm, setOrderForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    address: ''
  })
  const submittingRef = useRef(false)

  const tx = (_en, _fr, ar) => ar

  const unitPrice = product ? getUnitPrice(product) : 0
  const discountPercentage = Number(product?.discountPercentage) || 0
  const hasDiscount = discountPercentage > 0 && unitPrice < Number(product?.price || 0)
  const totalPrice = unitPrice * quantity
  const images = product?.images?.filter(Boolean) || []
  const activeImage = images[selectedImageIndex] || ''
  const headline = product?.headline?.trim() || ''
  const benefits = (product?.benefits || []).filter(Boolean)
  const features = (product?.features || []).filter(Boolean)
  const specifications = (product?.specifications || []).filter((item) => item?.label && item?.value)
  const faqs = (product?.faqs || []).filter((item) => item?.question && item?.answer)
  const reviews = product?.ratings || []

  const shareImage = useMemo(() => {
    if (!activeImage) return undefined
    if (activeImage.startsWith('http://') || activeImage.startsWith('https://')) return activeImage
    return `${window.location.origin}${activeImage.startsWith('/') ? activeImage : `/${activeImage}`}`
  }, [activeImage])

  usePageMeta({
    title: product ? `${product.name} | FINDSTORE` : 'FINDSTORE',
    description: product
      ? (headline || product.description || product.name).replace(/\s+/g, ' ').slice(0, 160)
      : 'FINDSTORE',
    image: shareImage,
    url: product ? `${window.location.origin}/product/${product.slug || slug}` : undefined
  })

  useEffect(() => {
    let cancelled = false

    const loadProduct = async () => {
      setLoading(true)
      setOrderSuccess(null)
      try {
        const res = await api.get(`/products/${encodeURIComponent(slug)}`)
        if (cancelled) return
        setProduct(res.data)
        setSelectedImageIndex(0)
        setQuantity(1)
        if (res.data?.slug && res.data.slug !== slug) {
          navigate(`/product/${res.data.slug}`, { replace: true })
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('المنتج غير موجود')
          navigate('/')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProduct()
    return () => {
      cancelled = true
    }
  }, [slug, navigate])

  const scrollToOrder = () => {
    document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changeQuantity = (next) => {
    const max = Math.max(product?.stock || 1, 1)
    setQuantity(Math.min(max, Math.max(1, next)))
  }

  const handleBuyNow = () => {
    if (!product || product.stock < quantity) {
      toast.error(t('outOfStock') || 'Insufficient stock')
      return
    }
    openBuyNow(product, quantity)
  }

  const handleWhatsApp = () => {
    if (!product) return
    const productUrl = window.location.href
    const priceLabel = hasDiscount
      ? `${formatCurrency(unitPrice)} (${formatCurrency(product.price)})`
      : formatCurrency(unitPrice)
    const message = language === 'ar'
      ? `مرحبا! أنا مهتم بالمنتج: ${product.name}\nالسعر: ${priceLabel}\n${productUrl}`
      : language === 'fr'
        ? `Bonjour ! Je suis intéressé(e) par : ${product.name}\nPrix : ${priceLabel}\n${productUrl}`
        : `Hello! I'm interested in: ${product.name}\nPrice: ${priceLabel}\n${productUrl}`
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const handleSubmitReview = async (event) => {
    event.preventDefault()
    if (!user) {
      toast.error(t('pleaseLoginReview') || 'Please login to submit a review')
      return
    }
    try {
      const res = await api.post(`/products/${product._id}/reviews`, review)
      setProduct(res.data)
      setReview({ rating: 5, comment: '' })
      toast.success(t('reviewSubmitted') || 'Review submitted!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'تعذر إرسال التقييم')
    }
  }

  const handleOrder = async (event) => {
    event.preventDefault()
    if (!product || submittingRef.current) return

    const fullName = orderForm.fullName.trim()
    const phone = normalizeMoroccanPhone(orderForm.phone)
    const city = orderForm.city.trim()
    const address = orderForm.address.trim()

    if (fullName.length < 2 || !phone || city.length < 2 || address.length < 5) {
      toast.error(tx(
        'Enter your name, a Moroccan phone number, city, and full address.',
        'Indiquez votre nom, un numéro marocain, la ville et l’adresse complète.',
        'أدخل الاسم ورقم هاتف مغربي والمدينة والعنوان الكامل.'
      ))
      return
    }
    if (product.stock < quantity) {
      toast.error(t('outOfStock') || 'Insufficient stock')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const res = await api.post('/orders/guest', {
        items: [{ product: product._id, quantity }],
        customerName: fullName,
        customerPhone: phone,
        city,
        address,
        country: 'Morocco'
      })
      setOrderSuccess(res.data)
      setProduct((current) => current ? { ...current, stock: Math.max(0, current.stock - quantity) } : current)
      setOrderForm({ fullName: '', phone: '', city: '', address: '' })
      notifyAdminChange('orders')
      toast.success(tx(
        'Order confirmed. Our team will contact you shortly.',
        'Commande confirmée. Notre équipe vous contactera rapidement.',
        'تم تأكيد الطلب. سيتواصل معك فريقنا قريبا.'
      ))
    } catch (error) {
      toast.error(error.response?.data?.message || tx(
        'Could not place the order. Please try again.',
        'Impossible d’enregistrer la commande. Réessayez.',
        'تعذر حفظ الطلب. حاول مرة أخرى.'
      ))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-3xl bg-gray-200 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-4/5 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-14 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const inStock = product.stock > 0
  const detailFacts = [
    product.category ? { label: t('category') || 'Category', value: product.category } : null,
    product.subcategory ? { label: tx('Collection', 'Collection', 'المجموعة'), value: product.subcategory } : null,
    { label: t('stock') || 'Stock', value: inStock ? `${product.stock}` : (t('outOfStockLabel') || 'Out of stock') }
  ].filter(Boolean)
  const specRows = specifications.length > 0 ? specifications : detailFacts

  return (
    <div className={`bg-[#f6f5f3] text-gray-900 pb-24 lg:pb-0 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <nav className="text-sm text-gray-500 mb-6 flex flex-wrap items-center gap-2">
          <Link to="/" className="hover:text-gray-900">FINDSTORE</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-900">{t('products') || 'Products'}</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[12rem] sm:max-w-none">{product.name}</span>
        </nav>

        <section className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-8 lg:gap-14 items-start">
          <div>
            <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
              <button
                type="button"
                className="block w-full aspect-square bg-[#f3f1ee]"
                onClick={() => activeImage && setLightboxOpen(true)}
                aria-label={product.name}
              >
                {activeImage ? (
                  isVideoUrl(activeImage) ? (
                    <video src={activeImage} className="w-full h-full object-cover" controls playsInline />
                  ) : (
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = 'https://via.placeholder.com/900x900?text=FINDSTORE'
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">{t('noImageAvailable')}</div>
                )}
              </button>
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 bg-white ${
                      selectedImageIndex === index ? 'border-[#111]' : 'border-transparent'
                    }`}
                  >
                    {isVideoUrl(image) ? (
                      <video src={image} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#FF385C]">
              {product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-950">
              {product.name}
            </h1>
            {headline && (
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{headline}</p>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-semibold tracking-tight">{formatCurrency(unitPrice)}</p>
              {hasDiscount && (
                <>
                  <p className="text-lg text-gray-400 line-through mb-1">{formatCurrency(product.price)}</p>
                  <span className="mb-1 inline-flex items-center rounded-full bg-red-50 text-red-600 text-sm font-semibold px-3 py-1">
                    -{discountPercentage}%
                  </span>
                </>
              )}
            </div>
            <p className={`mt-3 text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
              {inStock ? `${t('inStockLabel') || 'In stock'} · ${product.stock}` : (t('outOfStockLabel') || 'Out of stock')}
            </p>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">{t('quantity') || 'Quantity'}</span>
              <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                <button type="button" onClick={() => changeQuantity(quantity - 1)} className="h-11 w-11 text-lg" aria-label="إنقاص الكمية">−</button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button type="button" onClick={() => changeQuantity(quantity + 1)} className="h-11 w-11 text-lg" aria-label="زيادة الكمية">+</button>
              </div>
              <span className="text-sm text-gray-500">{formatCurrency(totalPrice)}</span>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={scrollToOrder}
                disabled={!inStock}
                className="h-12 rounded-full bg-[#111] text-white font-semibold disabled:bg-gray-300"
              >
                {tx('Order now', 'Commander maintenant', 'اطلب الآن')}
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="h-12 rounded-full bg-[#25D366] text-white font-semibold"
              >
                WhatsApp
              </button>
            </div>
            <button type="button" onClick={handleBuyNow} disabled={!inStock} className="mt-3 text-sm font-medium text-gray-600 underline underline-offset-4 disabled:no-underline disabled:text-gray-400">
              {t('buyNow') || 'Buy now'}
            </button>
          </div>
        </section>

        <section className="mt-14 grid lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">{t('productOverview') || 'Overview'}</h2>
            <p className="mt-4 text-gray-600 leading-7 whitespace-pre-line">{product.description}</p>
          </article>
          <aside className="bg-white rounded-3xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold">{tx('Delivery', 'Livraison', 'التوصيل')}</h2>
            <p className="mt-3 text-sm text-gray-600 leading-6">
              {product.deliveryNote || tx(
                'Cash on delivery across Morocco. We confirm every order by phone before shipping.',
                'Paiement à la livraison partout au Maroc. Chaque commande est confirmée par téléphone.',
                'الدفع عند الاستلام في جميع مدن المغرب. نؤكد كل طلب عبر الهاتف قبل الشحن.'
              )}
            </p>
            <h2 className="mt-6 text-lg font-semibold">{tx('Support', 'Assistance', 'الدعم')}</h2>
            <p className="mt-3 text-sm text-gray-600 leading-6">
              {product.supportNote || tx(
                'Questions about this product? Message FINDSTORE on WhatsApp and include the product name.',
                'Une question ? Écrivez à FINDSTORE sur WhatsApp en indiquant le nom du produit.',
                'لأي سؤال، راسل FINDSTORE عبر واتساب مع اسم المنتج.'
              )}
            </p>
          </aside>
        </section>

        {benefits.length > 0 && (
          <section className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="bg-white rounded-2xl border border-black/5 p-5">
                <p className="font-medium leading-6">{benefit}</p>
              </div>
            ))}
          </section>
        )}

        {features.length > 0 && (
          <section className="mt-6 bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">{t('productFeatures') || 'Features'}</h2>
            <ul className="mt-5 grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <li key={feature} className="rounded-2xl bg-[#f6f5f3] px-4 py-3 text-gray-700">{feature}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{tx('Specifications', 'Caractéristiques', 'المواصفات')}</h2>
          <dl className="mt-5 divide-y divide-gray-100">
            {specRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="grid sm:grid-cols-[180px_1fr] gap-2 py-3">
                <dt className="text-sm text-gray-500">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="order-form" className="mt-6 scroll-mt-24 grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6">
          <div className="bg-[#111] text-white rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">FINDSTORE</p>
            <h2 className="mt-3 text-3xl font-semibold">{tx('Place your order', 'Passer la commande', 'أرسل طلبك')}</h2>
            <p className="mt-3 text-white/70 leading-6">
              {tx(
                'The product is already selected. Choose a quantity and we will call you to confirm delivery.',
                'Le produit est déjà sélectionné. Choisissez la quantité, nous vous appelons pour confirmer.',
                'المنتج محدد تلقائيا. اختر الكمية وسنتصل بك لتأكيد التوصيل.'
              )}
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/60">{tx('Product', 'Produit', 'المنتج')}</span>
                <span className="font-medium text-right">{product.name}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/60">{t('quantity') || 'Quantity'}</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">{tx('Total', 'Total', 'المجموع')}</span>
                <span className="text-xl font-semibold">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
            {orderSuccess ? (
              <div>
                <h3 className="text-2xl font-semibold">{tx('Order received', 'Commande reçue', 'تم استلام الطلب')}</h3>
                <p className="mt-3 text-gray-600 leading-6">
                  {tx(
                    'Your order is now in the FINDSTORE order list. Keep your phone available.',
                    'Votre commande est enregistrée. Gardez votre téléphone disponible.',
                    'تم حفظ طلبك. أبق هاتفك قريبا.'
                  )}
                </p>
                <p className="mt-4 text-sm text-gray-500">#{String(orderSuccess._id || '').slice(-8).toUpperCase()}</p>
                <button
                  type="button"
                  onClick={() => setOrderSuccess(null)}
                  className="mt-6 h-11 px-5 rounded-full bg-[#111] text-white font-semibold"
                >
                  {tx('Place another order', 'Nouvelle commande', 'طلب جديد')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrder} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{tx('Full name', 'Nom complet', 'الاسم الكامل')}</span>
                  <input
                    value={orderForm.fullName}
                    onChange={(event) => setOrderForm({ ...orderForm, fullName: event.target.value })}
                    autoComplete="name"
                    required
                    className="mt-1.5 w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{tx('Phone number', 'Numéro de téléphone', 'رقم الهاتف')}</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={orderForm.phone}
                    onChange={(event) => setOrderForm({ ...orderForm, phone: event.target.value })}
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                    required
                    className="mt-1.5 w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{tx('City', 'Ville', 'المدينة')}</span>
                  <input
                    value={orderForm.city}
                    onChange={(event) => setOrderForm({ ...orderForm, city: event.target.value })}
                    autoComplete="address-level2"
                    required
                    className="mt-1.5 w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{tx('Full address', 'Adresse complète', 'العنوان الكامل')}</span>
                  <textarea
                    value={orderForm.address}
                    onChange={(event) => setOrderForm({ ...orderForm, address: event.target.value })}
                    required
                    rows={3}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{tx('Product', 'Produit', 'المنتج')}</span>
                  <input value={product.name} readOnly className="mt-1.5 w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-700" />
                </label>
                <button
                  type="submit"
                  disabled={submitting || !inStock}
                  className="w-full h-12 rounded-full bg-[#FF385C] hover:bg-[#E61E4D] text-white font-semibold disabled:opacity-60"
                >
                  {submitting
                    ? tx('Sending...', 'Envoi...', 'جار الإرسال...')
                    : tx(`Order · ${formatCurrency(totalPrice)}`, `Commander · ${formatCurrency(totalPrice)}`, `اطلب · ${formatCurrency(totalPrice)}`)}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{tx('Customer reviews', 'Avis clients', 'آراء الزبائن')}</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-gray-500">{t('noReviews') || 'No reviews yet'}</p>
          ) : (
            <div className="mt-5 space-y-4">
              {reviews.map((rating, index) => (
                <article key={rating._id || index} className="rounded-2xl bg-[#f6f5f3] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{rating.user?.name || tx('Customer', 'Client', 'زبون')}</p>
                    <p className="text-amber-500">{'★'.repeat(rating.rating || 0)}</p>
                  </div>
                  {rating.comment && <p className="mt-2 text-gray-600 leading-6">{rating.comment}</p>}
                </article>
              ))}
            </div>
          )}

          {user && (
            <form onSubmit={handleSubmitReview} className="mt-6 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
              <select
                value={review.rating}
                onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })}
                className="h-12 px-3 rounded-xl border border-gray-200"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} ★</option>
                ))}
              </select>
              <input
                value={review.comment}
                onChange={(event) => setReview({ ...review, comment: event.target.value })}
                required
                placeholder={t('yourComment') || 'Your comment'}
                className="h-12 px-4 rounded-xl border border-gray-200"
              />
              <button type="submit" className="h-12 px-5 rounded-xl bg-[#111] text-white font-semibold">
                {t('submitReview') || 'Submit'}
              </button>
            </form>
          )}
        </section>

        <section className="mt-6 bg-white rounded-3xl border border-black/5 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">{tx('Questions', 'Questions fréquentes', 'أسئلة شائعة')}</h2>
          <div className="mt-4 divide-y divide-gray-100">
            {(faqs.length > 0 ? faqs : [
              {
                question: tx('How does delivery work?', 'Comment se passe la livraison ?', 'كيف يتم التوصيل؟'),
                answer: tx(
                  'FINDSTORE delivers across Morocco. After you order, we call to confirm the address and delivery time.',
                  'FINDSTORE livre partout au Maroc. Après la commande, nous appelons pour confirmer l’adresse.',
                  'FINDSTORE يوصل إلى جميع مدن المغرب، ونتصل بك لتأكيد العنوان.'
                )
              },
              {
                question: tx('When do I pay?', 'Quand dois-je payer ?', 'متى أدفع؟'),
                answer: tx(
                  'You pay on delivery. The total shown on this page is the amount to prepare.',
                  'Le paiement se fait à la livraison. Le total affiché est le montant à préparer.',
                  'الدفع عند الاستلام. المبلغ الظاهر هو المبلغ المطلوب.'
                )
              },
              {
                question: tx('Can I change the quantity?', 'Puis-je changer la quantité ?', 'هل يمكن تغيير الكمية؟'),
                answer: tx(
                  'Yes. Use the quantity control before submitting the form. The total updates immediately.',
                  'Oui. Modifiez la quantité avant d’envoyer le formulaire. Le total se met à jour immédiatement.',
                  'نعم. غيّر الكمية قبل الإرسال وسيتحدث المجموع مباشرة.'
                )
              }
            ]).map((faq, index) => (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full py-4 flex items-center justify-between gap-4 text-left font-medium"
                >
                  <span>{faq.question}</span>
                  <span className="text-gray-400">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && <p className="pb-4 text-gray-600 leading-6">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={scrollToOrder}
          className="w-full h-12 rounded-full bg-[#FF385C] text-white font-semibold"
        >
          اطلب الآن
        </button>
      </div>

      {lightboxOpen && activeImage && !isVideoUrl(activeImage) && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <img src={activeImage} alt={product.name} className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}

export default ProductDetail
