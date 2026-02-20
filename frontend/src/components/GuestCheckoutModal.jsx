import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const GuestCheckoutModal = () => {
  const {
    cartItems,
    getCartTotal,
    getFinalPrice,
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
    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setSubmitting(true)
    try {
      const items = cartItems.map((item) => ({
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto border border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!orderSuccess ? (
          <>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {t('orderDetails') || 'Order details'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('orderSummary') || 'Order summary'}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(getCartTotal())}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t('fullName') || 'Full name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Ahmed Ali"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t('phone') || 'Phone number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="e.g. +212 6 00 00 00 00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t('city') || 'City'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Casablanca"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                    {t('address') || 'Address'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, building, floor..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF385C] focus:ring-2 focus:ring-[#FF385C]/20 outline-none transition-all resize-none"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('continueShopping') || 'Continue shopping'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
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
                      `${t('submitOrder') || 'Submit order'} – ${formatCurrency(getCartTotal())}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('orderPlacedSuccess') || 'Order placed successfully!'}</h3>
            <p className="text-gray-600 mb-1">We will contact you to confirm and arrange delivery.</p>
            {orderId && (
              <p className="text-sm text-gray-500 font-mono mb-6">#{orderId.slice(-8).toUpperCase()}</p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-[#FF385C] hover:bg-[#E61E4D] text-white transition-colors"
            >
              {t('continueShopping') || 'Continue shopping'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GuestCheckoutModal
