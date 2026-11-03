import { useEffect, useRef, useState } from 'react'
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

const BuyNowModal = () => {
  const { buyNowProduct, closeBuyNow, setBuyNowQuantity } = useCart()
  const [form, setForm] = useState(orderDraft)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState(null)
  const submittingRef = useRef(false)
  const open = Boolean(buyNowProduct?.product)

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
      orderDraft = emptyDraft()
      setForm(emptyDraft())
      setOrder(res.data)
      notifyAdminChange('orders')
    } catch (error) {
      setErrors({ form: error.response?.data?.message || 'تعذر حفظ الطلب. حاول مرة أخرى.' })
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const close = () => {
    if (submittingRef.current) return
    setOrder(null)
    closeBuyNow()
  }

  const reference = order?._id ? String(order._id).slice(-8).toUpperCase() : ''

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        dir="rtl"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white text-[#242424] shadow-2xl sm:max-w-lg sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
          <h2 id="order-title" className="text-lg font-semibold">{order ? 'تم استلام الطلب' : 'اطلب الآن'}</h2>
          <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F7F7F5]" aria-label="إغلاق">
            ×
          </button>
        </div>

        {order ? (
          <div className="px-5 py-8 text-center">
            <p className="text-2xl font-semibold">شكرا لك</p>
            <p className="mt-3 leading-7 text-[#777777]">غادي نتواصلو معاك لتأكيد المعلومات والتوصيل.</p>
            {reference && <p className="mt-4 text-sm font-medium">رقم الطلب: {reference}</p>}
            <button type="button" onClick={close} className="mt-6 h-12 rounded-full bg-[#171717] px-6 font-semibold text-white">
              متابعة التسوق
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export default BuyNowModal
