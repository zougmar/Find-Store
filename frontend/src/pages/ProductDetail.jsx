import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { formatDecimalComma, formatDirham, getUnitPrice, isVideoUrl } from '../utils/product'
import usePageMeta from '../hooks/usePageMeta'

const WHATSAPP_PHONE = '212707625535'

const WhatsAppIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const processFaqs = [
  {
    question: 'كيف يمكنني طلب المنتج؟',
    answer: 'اضغط على «اطلب الآن»، أدخل اسمك ورقم هاتفك المغربي والمدينة والعنوان، ثم أكد الطلب. نتصل بك لتأكيد المعلومات قبل الشحن.'
  },
  {
    question: 'واش كاين التوصيل لجميع المدن؟',
    answer: 'نعم، FINDSTORE يوصل الطلبات إلى جميع مدن المغرب، والدفع عند الاستلام.'
  },
  {
    question: 'كيفاش نأكد الطلب ديالي؟',
    answer: 'بعد إرسال الطلب نتصل بك على الرقم الذي أدخلته لتأكيد العنوان والكمية قبل إرسال المنتج.'
  },
  {
    question: 'شحال كتاخد مدة التوصيل؟',
    answer: 'مدة التوصيل تختلف حسب المدينة. نخبرك بالموعد المتوقع أثناء مكالمة التأكيد.'
  }
]

const ProductDetail = () => {
  const { slug } = useParams()
  const { openBuyNow } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  const unitPrice = product ? getUnitPrice(product) : 0
  const discountPercentage = Number(product?.discountPercentage) || 0
  const hasDiscount = discountPercentage > 0 && unitPrice < Number(product?.price || 0)
  const totalPrice = unitPrice * quantity
  const images = useMemo(() => (product?.images || []).filter(Boolean), [product])
  const activeImage = images[selectedImageIndex] || ''
  const headline = product?.headline?.trim() || ''
  const benefits = (product?.benefits || []).filter(Boolean)
  const features = (product?.features || []).filter(Boolean)
  const benefitItems = benefits.length > 0 ? benefits : features
  const specifications = (product?.specifications || []).filter((item) => item?.label && item?.value)
  const productFaqs = (product?.faqs || []).filter((item) => item?.question && item?.answer)
  const faqs = [...productFaqs, ...processFaqs]
  const reviews = (product?.ratings || []).filter((item) => item?.comment || item?.rating)

  const shareImage = useMemo(() => {
    if (!activeImage) return undefined
    if (activeImage.startsWith('http://') || activeImage.startsWith('https://')) return activeImage
    return `${window.location.origin}${activeImage.startsWith('/') ? activeImage : `/${activeImage}`}`
  }, [activeImage])

  usePageMeta({
    title: product ? `${product.name} | FINDSTORE` : missing ? 'المنتج غير موجود | FINDSTORE' : 'FINDSTORE',
    description: product
      ? (headline || product.description || product.name).replace(/\s+/g, ' ').slice(0, 160)
      : 'FINDSTORE',
    image: shareImage,
    url: product ? `${window.location.origin}/product/${product.slug || slug}` : undefined
  })

  useEffect(() => {
    let cancelled = false

    const loadProduct = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true)
      try {
        const res = await api.get(`/products/${encodeURIComponent(slug)}`)
        if (cancelled) return
        setProduct(res.data)
        setMissing(false)
        setSelectedImageIndex((current) => {
          const count = (res.data?.images || []).filter(Boolean).length
          return count > 0 && current < count ? current : 0
        })
      } catch {
        if (!cancelled && !silent) {
          setProduct(null)
          setMissing(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setQuantity(1)
    loadProduct()

    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true
    })
    socket.on('sync', (payload) => {
      if (!payload?.scope || payload.scope === 'products' || payload.scope === 'all') {
        loadProduct({ silent: true })
      }
    })
    const onFocus = () => loadProduct({ silent: true })
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      socket.removeAllListeners()
      socket.disconnect()
      window.removeEventListener('focus', onFocus)
    }
  }, [slug])

  const maxQuantity = Math.max(1, Math.min(50, product?.stock || 1))
  const changeQuantity = (next) => setQuantity(Math.min(maxQuantity, Math.max(1, next)))
  const inStock = (product?.stock || 0) > 0

  const orderNow = () => {
    if (!product || !inStock) return
    openBuyNow(product, quantity)
  }

  const scrollToDetails = () => {
    document.getElementById('product-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openWhatsApp = () => {
    if (!product) return
    const message = `مرحبا! أنا مهتم بالمنتج: ${product.name}\nالثمن: ${formatDirham(unitPrice)}\n${window.location.href}`
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-12">
          <div className="aspect-square animate-pulse rounded-[28px] bg-[#F7F7F5] lg:order-2" />
          <div className="space-y-4 lg:order-1">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[#F7F7F5]" />
            <div className="h-20 animate-pulse rounded bg-[#F7F7F5]" />
            <div className="h-12 w-40 animate-pulse rounded bg-[#F7F7F5]" />
          </div>
        </div>
      </div>
    )
  }

  if (missing || !product) {
    return (
      <div className="bg-white px-4 py-24 text-center text-[#242424]" dir="rtl">
        <p className="text-sm text-[#777777]">FINDSTORE</p>
        <h1 className="mt-3 text-3xl font-semibold">هذا المنتج غير موجود</h1>
        <p className="mx-auto mt-3 max-w-md text-[#777777]">تأكد من الرابط أو عد إلى قائمة المنتجات.</p>
        <Link to="/products" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#171717] px-6 font-semibold text-white">
          جميع المنتجات
        </Link>
      </div>
    )
  }

  const showcase = images.length > 1 ? images.slice(1) : images

  return (
    <div className="bg-white pb-28 text-[#242424]" dir="rtl">
      <section className="bg-[#F7F7F5]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-14">
        <div className="order-1 lg:sticky lg:top-24 lg:order-2">
          <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_24px_60px_rgba(23,23,23,0.08)]">
            <button type="button" className="block aspect-square w-full" onClick={() => activeImage && setLightboxOpen(true)} aria-label={product.name}>
              {activeImage ? (
                isVideoUrl(activeImage) ? (
                  <video key={activeImage} src={activeImage} className="h-full w-full object-cover" controls playsInline />
                ) : (
                  <img key={activeImage} src={activeImage} alt={product.name} className="h-full w-full object-contain p-4 transition duration-500 sm:p-8" />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-[#777777]">لا توجد صورة</div>
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
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-white sm:h-20 sm:w-20 ${selectedImageIndex === index ? 'border-[#171717]' : 'border-transparent'}`}
                >
                  {isVideoUrl(image) ? (
                    <video src={image} className="h-full w-full object-cover" muted />
                  ) : (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="order-2 rounded-[32px] bg-white p-6 shadow-sm sm:p-8 lg:order-1">
          {product.category && <p className="text-sm font-medium text-[#D97736]">{product.category}</p>}
          <h1 className="mt-2 text-3xl font-semibold leading-snug sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-base leading-8 text-[#777777] sm:text-lg">
            {headline || product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold sm:text-4xl">{formatDirham(unitPrice)}</p>
            {hasDiscount && (
              <>
                <p className="mb-1 text-lg text-[#777777] line-through">{formatDirham(product.price)}</p>
                <span className="mb-1 rounded-full bg-[#F7F7F5] px-3 py-1 text-sm font-semibold text-[#D97736]">-{formatDecimalComma(discountPercentage)}%</span>
              </>
            )}
          </div>
          <p className={`mt-3 text-sm font-medium ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
            {inStock ? `متوفر · ${product.stock}` : 'غير متوفر حاليا'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#777777]">
            {product.deliveryNote || 'التوصيل متوفر لجميع مدن المغرب، والدفع عند الاستلام بعد تأكيد الطلب عبر الهاتف.'}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm text-[#777777]">الكمية</span>
            <div className="inline-flex items-center rounded-full border border-black/10">
              <button type="button" className="h-11 w-11 text-lg" onClick={() => changeQuantity(quantity - 1)} aria-label="إنقاص الكمية">−</button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button type="button" className="h-11 w-11 text-lg" onClick={() => changeQuantity(quantity + 1)} aria-label="زيادة الكمية">+</button>
            </div>
            <span className="text-sm text-[#777777]">{formatDirham(totalPrice)}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={orderNow} disabled={!inStock} className="h-12 rounded-full bg-[#171717] font-semibold text-white disabled:bg-neutral-300">
              اطلب الآن
            </button>
            <button type="button" onClick={scrollToDetails} className="h-12 rounded-full border border-black/10 font-semibold">
              اكتشف التفاصيل
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-white transition hover:bg-[#128C7E] sm:col-span-2"
            >
              <WhatsAppIcon />
              راسلنا عبر واتساب
            </button>
          </div>
        </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {['توصيل لجميع أنحاء المغرب', 'طلب سهل وسريع', 'خدمة الزبناء', 'منتجات مختارة بعناية'].map((item) => (
            <p key={item} className="text-sm font-medium leading-6">{item}</p>
          ))}
        </div>
      </section>

      {benefitItems.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">ما يميز هذا المنتج</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefitItems.map((item) => (
              <article key={item} className="rounded-3xl bg-[#F7F7F5] p-6">
                <span className="mb-4 block h-2 w-2 rounded-full bg-[#D97736]" />
                <p className="leading-8">{item}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="product-details" className="scroll-mt-24 bg-[#F7F7F5] py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <article className="rounded-[28px] bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold">تفاصيل المنتج</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-[#555]">{product.description}</p>
          </article>
          {specifications.length > 0 && (
            <article className="rounded-[28px] bg-white p-6 sm:p-8">
              <h2 className="text-2xl font-semibold">المواصفات</h2>
              <dl className="mt-4 divide-y divide-black/5">
                {specifications.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
                    <dt className="text-sm text-[#777777]">{row.label}</dt>
                    <dd className="font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )}
        </div>
        {reviews.length > 0 && (
          <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold">آراء الزبائن</h2>
            <div className="mt-4 grid gap-3">
              {reviews.map((review, index) => (
                <article key={review._id || index} className="rounded-3xl bg-white p-5">
                  <p className="font-medium">{review.user?.name || 'زبون'}</p>
                  <p className="mt-1 text-[#D97736]">{'★'.repeat(review.rating || 0)}</p>
                  {review.comment && <p className="mt-2 leading-7 text-[#555]">{review.comment}</p>}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {showcase.map((image, index) => (
          <article key={`${image}-${index}`} className={`grid items-center gap-8 lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div className="overflow-hidden rounded-[28px] bg-[#F7F7F5]">
              {isVideoUrl(image) ? (
                <video src={image} className="aspect-[4/5] w-full object-cover" controls playsInline />
              ) : (
                <img src={image} alt={product.name} loading="lazy" className="aspect-[4/5] w-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[#D97736]">FINDSTORE</p>
              <h2 className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl">{headline || product.name}</h2>
              <p className="mt-4 leading-8 text-[#777777]">{headline ? product.description : product.category}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="bg-[#F7F7F5] py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold sm:text-3xl">أسئلة شائعة</h2>
          <div className="mt-6 divide-y divide-black/10">
            {faqs.map((faq, index) => (
              <div key={faq.question}>
                <button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-4 text-start font-medium">
                  <span>{faq.question}</span>
                  <span className="text-[#777777]">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && <p className="pb-4 leading-8 text-[#555]">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-[32px] bg-[#171717] px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold">واجد تطلب المنتج ديالك؟</h2>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-white/70">كمّل الطلب ديالك بسهولة وغادي نتواصلو معاك لتأكيد المعلومات.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={orderNow} disabled={!inStock} className="h-12 rounded-full bg-white px-8 font-semibold text-[#171717] disabled:opacity-50">
              اطلب الآن
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white transition hover:bg-[#20BA5A]"
            >
              <WhatsAppIcon />
              واتساب
            </button>
          </div>
        </div>
      </section>

      {createPortal(
        <div
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/5 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          dir="rtl"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <button type="button" onClick={orderNow} disabled={!inStock} className="h-12 flex-1 rounded-full bg-[#171717] font-semibold text-white disabled:bg-neutral-300">
              اطلب الآن · {formatDirham(totalPrice)}
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md shadow-[#25D366]/30"
              aria-label="راسلنا عبر واتساب"
            >
              <WhatsAppIcon className="h-6 w-6" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {lightboxOpen && activeImage && !isVideoUrl(activeImage) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxOpen(false)}>
          <img src={activeImage} alt={product.name} className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}

export default ProductDetail
