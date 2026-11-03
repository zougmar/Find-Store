import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../utils/api'
import { formatDirham, getUnitPrice, isVideoUrl } from '../utils/product'
import { isValidMoroccanPhone, normalizeMoroccanPhone } from '../utils/phone'
import { notifyAdminChange } from '../utils/adminSync'

const emptyDraft = () => ({
  customerName: '',
  customerPhone: '',
  city: '',
  address: '',
  note: ''
})

let orderDraft = emptyDraft()

const formatDh = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return ''
  return `${value.toLocaleString('fr-MA', { maximumFractionDigits: 2 })} DH`
}

const statusLabel = (order) => {
  const status = order?.orderStatus
  if (status === 'new' || status === 'pending') return '🟡 في انتظار تأكيد الطلب'
  const labels = {
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التسليم',
    cancelled: 'ملغى'
  }
  return labels[status] || ''
}

const SNOWFLAKES = Array.from({ length: 36 }, (_, index) => ({
  id: index,
  left: (index * 29) % 100,
  size: index % 8 === 0 ? 16 + (index % 3) * 6 : 4 + (index % 5) * 2,
  duration: 9 + (index % 8) * 1.6,
  delay: -((index % 12) * 0.8),
  drift: (index % 2 === 0 ? 1 : -1) * (18 + (index % 6) * 10),
  blur: index % 8 === 0,
  spin: index % 3 === 0 ? 180 : 0
}))

const CONFETTI = ['#D97736', '#25D366', '#7DB7E8', '#F2C14E', '#E7B8A0', '#171717', '#9AD7FF', '#FFFFFF'].map((color, index) => ({
  id: index,
  color,
  left: 46 + ((index % 2 === 0 ? -1 : 1) * (6 + index * 3)),
  delay: index * 0.04
}))

const arabicError = (error) => {
  const message = error?.response?.data?.message || ''
  if (message.includes('full name')) return 'أدخل الاسم الكامل'
  if (message.includes('phone')) return 'أدخل رقم هاتف مغربي صحيح'
  if (message.includes('city')) return 'أدخل المدينة'
  if (message.includes('address')) return 'أدخل العنوان الكامل'
  if (message.includes('Quantity')) return 'الكمية يجب أن تكون بين 1 و 50'
  if (message.includes('stock')) return 'الكمية المطلوبة غير متوفرة'
  if (message.includes('not found')) return 'المنتج غير موجود'
  if (message.includes('just submitted')) return 'تم إرسال هذا الطلب للتو. انتظر قليلاً قبل المحاولة مرة أخرى.'
  return 'تعذر حفظ الطلب. حاول مرة أخرى.'
}

const BuyNowModal = () => {
  const navigate = useNavigate()
  const { buyNowProduct, closeBuyNow, setBuyNowQuantity } = useCart()
  const [form, setForm] = useState(orderDraft)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState(null)
  const [copied, setCopied] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  const submittingRef = useRef(false)
  const copyTimer = useRef(null)
  const open = Boolean(buyNowProduct?.product)

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => {
      media.removeEventListener('change', update)
      window.clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    setForm(orderDraft)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape' && !submittingRef.current) closeBuyNow()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, closeBuyNow])

  if (!open) return null

  const product = buyNowProduct.product
  const quantity = Math.min(50, Math.max(1, Number(buyNowProduct.quantity) || 1))
  const unitPrice = getUnitPrice(product)
  const total = unitPrice * quantity
  const image = product.images?.find((item) => item && !isVideoUrl(item))

  const update = (name, value) => {
    const next = { ...form, [name]: value }
    orderDraft = next
    setForm(next)
  }

  const validate = () => {
    const next = {}
    if (form.customerName.trim().length < 2) next.customerName = 'أدخل الاسم الكامل'
    if (!isValidMoroccanPhone(form.customerPhone)) next.customerPhone = 'أدخل رقم هاتف مغربي صحيح'
    if (form.city.trim().length < 2) next.city = 'أدخل المدينة'
    if (form.address.trim().length < 5) next.address = 'أدخل العنوان الكامل'
    if (!Number.isInteger(quantity) || quantity < 1) next.quantity = 'الكمية غير صحيحة'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submittingRef.current || !validate()) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const res = await api.post('/orders/guest', {
        items: [{ product: product._id, quantity }],
        customerName: form.customerName.trim(),
        customerPhone: normalizeMoroccanPhone(form.customerPhone),
        city: form.city.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        country: 'Morocco'
      })
      if (!res.data?._id) {
        setErrors({ form: 'تعذر تأكيد الطلب. حاول مرة أخرى.' })
        return
      }
      orderDraft = emptyDraft()
      setForm(emptyDraft())
      setOrder(res.data)
      notifyAdminChange('orders')
    } catch (error) {
      setOrder(null)
      setErrors({ form: arabicError(error) })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const close = () => {
    if (submittingRef.current) return
    setOrder(null)
    setCopied(false)
    closeBuyNow()
  }

  const returnToStore = () => {
    close()
    navigate('/')
  }

  const copyReference = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const reference = order?._id ? String(order._id).slice(-8).toUpperCase() : ''
  const saved = order?.paymentDetails || {}
  const savedItem = order?.items?.[0]
  const savedName = typeof savedItem?.product === 'object' ? savedItem.product?.name : ''
  const savedQuantity = savedItem?.quantity
  const savedPrice = savedItem?.price
  const savedTotal = order?.totalAmount
  const savedStatus = statusLabel(order)

  if (order) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        dir="rtl"
        className="fixed inset-0 z-[80] overflow-y-auto bg-gradient-to-b from-[#f3f8ff] via-white to-[#e5f1fb] font-[Cairo,sans-serif] text-[#242424]"
      >
        {!reduceMotion && (
          <div className={`pointer-events-none absolute inset-0 overflow-hidden ${pageHidden ? 'findstore-paused' : ''}`} aria-hidden="true">
            <style>{`
              @keyframes findstore-snow { from { transform: translate3d(0, -12vh, 0) rotate(0deg); } to { transform: translate3d(var(--drift), 112vh, 0) rotate(var(--spin)); } }
              @keyframes findstore-burst { 0% { transform: translate(-50%, 0) scale(0.4); opacity: 1; } 100% { transform: translate(calc(-50% + var(--x)), 42vh) scale(1); opacity: 0; } }
              @keyframes findstore-check { to { stroke-dashoffset: 0; } }
              @keyframes findstore-fade { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
              .findstore-paused, .findstore-paused * { animation-play-state: paused !important; }
            `}</style>
            {SNOWFLAKES.map((flake) => (
              <span
                key={flake.id}
                className="absolute top-0 rounded-full bg-white"
                style={{
                  left: `${flake.left}%`,
                  width: flake.size,
                  height: flake.size,
                  opacity: flake.blur ? 0.7 : 0.95,
                  boxShadow: '0 0 10px 2px rgba(147, 191, 230, 0.85)',
                  filter: flake.blur ? 'blur(2.5px)' : undefined,
                  animation: `findstore-snow ${flake.duration}s linear ${flake.delay}s infinite`,
                  ['--drift']: `${flake.drift}px`,
                  ['--spin']: `${flake.spin}deg`
                }}
              />
            ))}
            {CONFETTI.map((piece) => (
              <span
                key={piece.id}
                className="absolute top-24 h-2.5 w-2.5 rounded-sm"
                style={{
                  left: '50%',
                  background: piece.color,
                  animation: `findstore-burst 1.15s ease-out ${piece.delay}s both`,
                  ['--x']: `${piece.left - 50}px`
                }}
              />
            ))}
          </div>
        )}
        <div className="relative z-10 flex min-h-screen w-full flex-col px-5 py-8 sm:px-10 lg:px-16" style={reduceMotion ? undefined : { animation: 'findstore-fade 0.35s ease-out' }}>
            <svg viewBox="0 0 72 72" className="mx-auto h-20 w-20" aria-hidden="true">
              <circle cx="36" cy="36" r="32" fill="#25D366" />
              <path
                d="M22 37.5 32 47.5 51 27"
                fill="none"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="48"
                strokeDashoffset={reduceMotion ? 0 : 48}
                style={reduceMotion ? undefined : { animation: 'findstore-check 0.55s 0.15s ease forwards' }}
              />
            </svg>
            <div className="absolute end-4 top-4">
              <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#F7F7F5]" aria-label="إغلاق">
                ×
              </button>
            </div>
            <h2 id="order-title" className="mt-8 text-center text-3xl font-semibold leading-snug sm:text-5xl">مبروك! طلبك تسجّل بنجاح!</h2>
            <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-9 text-[#555] sm:text-xl">
              شكراً على ثقتك في FINDSTORE ❤️
              <br />
              فرحانين باختيارك لينا! توصلنا بالطلب ديالك بنجاح، وغادي يتواصل معاك فريقنا قريباً باش يأكد معاك المعلومات ديال الطلب.
              <br />
              كنتمناو ليك تجربة شراء ممتعة! 💛
            </p>
            {savedStatus && (
              <p className="mt-4 text-center text-sm font-semibold">{savedStatus}</p>
            )}

            {reference && (
              <section className="mx-auto mt-8 w-full max-w-xl rounded-[28px] border border-[#D97736]/25 bg-white/95 p-5 text-center shadow-sm sm:p-6">
                <p className="text-lg font-semibold sm:text-2xl">📦 احتافظ برقم الطلب ديالك!</p>
                <p className="mt-3 text-sm leading-8 text-[#555] sm:text-base">
                  إلى بغيتي تعرف فين وصل الطلب ديالك، غير تواصل معانا وعطينا رقم الطلب ديالك، وغادي نعلموك بآخر المستجدات ديالو ❤️
                </p>
                <p className="mt-5 text-sm text-[#777777]">رقم الطلب</p>
                <p dir="ltr" className="mt-1 text-3xl font-semibold tracking-[0.18em] text-[#171717] sm:text-4xl">{reference}</p>
                <button
                  type="button"
                  onClick={() => copyReference(reference)}
                  className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-5 font-semibold"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth="1.8" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  نسخ رقم الطلب
                </button>
                {copied && <p className="mt-2 text-sm font-medium text-emerald-700">تم نسخ رقم الطلب بنجاح ✓</p>}
                <div className="mt-5 rounded-2xl bg-[#FFF6EC] px-4 py-4 text-start">
                  <p className="font-semibold text-[#9A3412]">مهم! ما تنساش رقم الطلب ديالك</p>
                  <p className="mt-2 text-sm leading-7 text-[#555]">رقم الطلب هو المرجع ديالك باش تقدر تسول على حالة التوصيل ديالو.</p>
                </div>
              </section>
            )}

            <dl className="mt-6 divide-y divide-black/5 rounded-3xl bg-white/90 px-4 shadow-sm backdrop-blur-sm">
              {[
                ['رقم الطلب', reference],
                ['الاسم الكامل', saved.customerName],
                ['رقم الهاتف', saved.customerPhone, true],
                ['المدينة', saved.city],
                ['العنوان', saved.address],
                ['اسم المنتج', savedName],
                ['الكمية', savedQuantity],
                ['ثمن الوحدة', savedPrice != null ? formatDh(savedPrice) : ''],
                ['المجموع الإجمالي', savedTotal != null ? formatDh(savedTotal) : '']
              ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '').map(([label, value, ltr]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <dt className="shrink-0 text-[#777777]">{label}</dt>
                  <dd dir={ltr ? 'ltr' : undefined} className="text-end font-medium leading-6">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
              {reference && (
                <button type="button" onClick={() => copyReference(reference)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 font-semibold">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth="1.8" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  نسخ رقم الطلب
                </button>
              )}
              <button type="button" onClick={returnToStore} className="h-12 rounded-full bg-[#171717] font-semibold text-white">
                العودة إلى المتجر
              </button>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        dir="rtl"
        className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white font-[Cairo,sans-serif] text-[#242424] shadow-2xl sm:max-w-xl sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
          <h2 id="order-title" className="text-lg font-semibold">اطلب الآن</h2>
          <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F7F7F5]" aria-label="إغلاق">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="flex items-center gap-3 rounded-2xl bg-[#F7F7F5] p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                {image && <img src={image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="mt-1 text-sm text-[#777777]">الثمن: {formatDirham(unitPrice)}</p>
                <p className="text-sm font-semibold">المجموع: {formatDirham(total)}</p>
              </div>
            </div>

            <label className="block text-sm">
              الكمية
              <div className="mt-2 inline-flex items-center rounded-full border border-black/10">
                <button type="button" className="h-11 w-11" onClick={() => setBuyNowQuantity(quantity - 1)} aria-label="إنقاص الكمية">−</button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button type="button" className="h-11 w-11" onClick={() => setBuyNowQuantity(Math.min(product.stock || 1, quantity + 1))} aria-label="زيادة الكمية">+</button>
              </div>
            </label>

            {[
              ['customerName', 'الاسم الكامل', 'text'],
              ['customerPhone', 'رقم الهاتف', 'tel'],
              ['city', 'المدينة', 'text']
            ].map(([name, label, type]) => (
              <label key={name} className="block text-sm">
                {label}
                <input
                  type={type}
                  inputMode={type === 'tel' ? 'tel' : undefined}
                  dir={type === 'tel' ? 'ltr' : undefined}
                  value={form[name]}
                  onChange={(event) => update(name, event.target.value)}
                  className="mt-1.5 h-12 w-full rounded-2xl border border-black/10 bg-[#F7F7F5] px-4 outline-none focus:border-[#171717] focus:bg-white"
                />
                {errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]}</span>}
              </label>
            ))}

            <label className="block text-sm">
              العنوان الكامل
              <textarea
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-[#F7F7F5] px-4 py-3 outline-none focus:border-[#171717] focus:bg-white"
              />
              {errors.address && <span className="mt-1 block text-xs text-red-600">{errors.address}</span>}
            </label>

            <label className="block text-sm">
              ملاحظات إضافية
              <textarea
                value={form.note}
                onChange={(event) => update('note', event.target.value)}
                rows={2}
                className="mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-[#F7F7F5] px-4 py-3 outline-none focus:border-[#171717] focus:bg-white"
              />
            </label>

            <p className="text-sm leading-6 text-[#777777]">الدفع عند الاستلام بعد تأكيد الطلب عبر الهاتف.</p>
            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

            <button type="submit" disabled={submitting} className="h-12 w-full rounded-full bg-[#171717] font-semibold text-white disabled:opacity-60">
              {submitting ? 'جار الإرسال...' : `أكد الطلب · ${formatDirham(total)}`}
            </button>
        </form>
      </div>
    </div>
  )
}

export default BuyNowModal
