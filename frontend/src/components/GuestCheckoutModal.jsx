import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const GuestCheckoutModal = () => {
  const {
    cartItems,
    clearCart,
    showGuestCheckoutModal,
    closeGuestCheckoutModal,
    setShowGuestCheckoutModal
  } = useCart()
  const { user } = useAuth()
  const { t, isRTL } = useLanguage()

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    city: '',
    address: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClose = () => {
    if (!submitting) {
      setShowGuestCheckoutModal(false)
      setOrderSuccess(false)
      setOrderId(null)
      setForm({ customerName: '', customerPhone: '', city: '', address: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customerName?.trim() || !form.customerPhone?.trim() || !form.city?.trim() || !form.address?.trim()) {
      toast.error('Please fill in all fields: name, phone, city, and address')
      return
    }
    if (form.customerPhone.replace(/\D/g, '').length < 8) {
      toast.error('Please enter a valid phone number')
      return
    }
    const itemsToOrder = Array.isArray(cartItems) ? cartItems : []
    if (itemsToOrder.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setSubmitting(true)
    try {
      const items = itemsToOrder.map((item) => ({
        product: item.product?._id || item.product,
        quantity: item.quantity
      }))
      const res = await api.post('/orders/guest', {
        items,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        city: form.city.trim(),
        address: form.address.trim()
      })
      setOrderId(res.data._id)
      clearCart()
      setOrderSuccess(true)
      toast.success('Order placed successfully! We will contact you soon.', {
        icon: '✅',
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '15px',
          padding: '14px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (!showGuestCheckoutModal || user) return null

  const tr = (key, fallback) => (typeof t === 'function' ? t(key) : null) || fallback
  const iconPos = isRTL ? 'right-3.5 left-auto' : 'left-3.5 right-auto'
  const inputPad = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border-0 ${isRTL ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!orderSuccess ? (
          <>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {tr('orderDetails', 'Order details')}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-2.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client / delivery information form only */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Delivery information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tr('fullName', 'Full name')} <span className="text-red-500">*</span>
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
                          placeholder="Ahmed Ali"
                          className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/15 outline-none transition-all placeholder:text-gray-400`}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tr('phone', 'Phone number')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className={`absolute ${iconPos} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></path>
                        </svg>
                        </span>
                        <input
                          type="tel"
                          name="customerPhone"
                          value={form.customerPhone}
                          onChange={handleChange}
                          placeholder="+212 600 000 000"
                          className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/15 outline-none transition-all placeholder:text-gray-400`}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tr('city', 'City')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className={`absolute ${iconPos} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </span>
                        <input
                          type="text"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="Casablanca"
                          className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/15 outline-none transition-all placeholder:text-gray-400`}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {tr('address', 'Address')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className={`absolute ${iconPos} top-4 text-gray-400 pointer-events-none`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </span>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="Street, building, floor, landmark..."
                          rows={3}
                          className={`w-full ${inputPad} py-3 border border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/15 outline-none transition-all resize-none placeholder:text-gray-400`}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1 py-3.5 px-5 rounded-xl font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {tr('continueShopping', 'Continue shopping')}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 px-5 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {tr('placingOrder', 'Placing order...')}
                      </>
                    ) : (
                      tr('submitOrder', 'Submit order')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-emerald-100">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{tr('orderPlacedSuccess', 'Order placed successfully!')}</h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto">We will contact you shortly to confirm and arrange delivery.</p>
            {orderId && (
              <p className="text-sm font-mono text-gray-500 bg-gray-100 px-4 py-2 rounded-lg inline-block mb-6">#{orderId.slice(-8).toUpperCase()}</p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 px-5 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white shadow-lg hover:shadow-xl transition-all"
            >
              {tr('continueShopping', 'Continue shopping')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GuestCheckoutModal
