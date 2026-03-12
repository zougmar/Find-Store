import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const BuyNowModal = () => {
  const { buyNowProduct, closeBuyNow, getFinalPrice } = useCart()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    city: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [thankYou, setThankYou] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClose = () => {
    if (!submitting) {
      closeBuyNow()
      setThankYou(false)
      setForm({
        customerName: '',
        customerPhone: '',
        city: '',
        address: ''
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName?.trim() || !form.customerPhone?.trim() || !form.city?.trim() || !form.address?.trim()) {
      toast.error(t('fillAllRequired') || 'Please fill in all required fields: name, phone, city, and address')
      return
    }
    if (form.customerPhone.replace(/\D/g, '').length < 8) {
      toast.error(t('validPhone') || 'Please enter a valid phone number')
      return
    }
    if (!buyNowProduct?.product) return

    const product = buyNowProduct.product
    const productId = product._id || product
    const quantity = buyNowProduct.quantity || 1

    setSubmitting(true)
    try {
      await api.post('/orders/guest', {
        items: [{ product: productId, quantity }],
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        city: form.city.trim(),
        address: form.address.trim()
      })
      setThankYou(true)
    } catch (err) {
      toast.error(err.response?.data?.message || t('orderFailed') || 'Failed to place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (!buyNowProduct?.product) return null

  const product = buyNowProduct.product
  const quantity = buyNowProduct.quantity || 1
  const price = getFinalPrice ? getFinalPrice(product) : (product.price != null ? product.price : 0)
  const total = price * quantity
  const productName = product.name || 'Product'
  const productImage = product.images?.[0]
  const iconPos = isRTL ? 'right-3.5 left-auto' : 'left-3.5 right-auto'
  const inputPad = isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!thankYou ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF385C] to-[#E61E4D] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('buyNow') || 'Buy Now'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-all disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {/* Product summary */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-200">
                    {productImage ? (
                      <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="font-semibold text-gray-900 truncate">{productName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {quantity} × {formatCurrency(price)}
                    </p>
                    <p className="text-base font-bold text-[#FF385C] mt-1">{formatCurrency(total)}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  {t('deliveryInformation') || 'Enter your details so we can process and deliver your order.'}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('fullName') || 'Full name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute ${iconPos} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    <input
                      type="text"
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      placeholder={t('fullName') || 'Your full name'}
                      className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all text-gray-900`}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('phoneNumber') || 'Phone number'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute ${iconPos} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </span>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={handleChange}
                      placeholder="+212 600 000 000"
                      className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all text-gray-900`}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('city') || 'City'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute ${iconPos} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    </span>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder={t('city') || 'City'}
                      className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all text-gray-900`}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('streetAddress') || 'Street address'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className={`absolute ${iconPos} top-4 text-gray-400 pointer-events-none`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </span>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder={t('streetAddress') || 'Street, building, floor...'}
                      rows={3}
                      className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all resize-none text-gray-900`}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-5 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('placingOrder') || 'Placing order...'}
                    </>
                  ) : (
                    <>
                      {t('completeOrder') || 'Complete order'}
                      <span className="font-bold">{formatCurrency(total)}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('thankYouPurchase') || 'Thank you!'}</h3>
            <p className="text-gray-600 mb-6">
              {t('orderReceived') || "We've received your order. Our team will contact you shortly to confirm details and arrange delivery."}
            </p>
            <button
              type="button"
              onClick={() => { navigate('/'); handleClose(); }}
              className="w-full py-3.5 px-5 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white transition-all"
            >
              {t('continueShopping') || 'Continue shopping'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyNowModal
