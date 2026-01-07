import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'
import { useLanguage } from '../../context/LanguageContext'

const DeliveryOrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [deliveryMan, setDeliveryMan] = useState(null)
  const [showWhatsAppLanguage, setShowWhatsAppLanguage] = useState(false)
  const { language, changeLanguage } = useLanguage()

  useEffect(() => {
    const token = localStorage.getItem('delivery_token')
    if (!token) {
      navigate('/delivery/login')
      return
    }

    fetchOrder()
    fetchDeliveryManProfile()
  }, [orderId, navigate])

  const fetchDeliveryManProfile = async () => {
    try {
      const res = await api.get('/delivery/me')
      setDeliveryMan(res.data)
    } catch (error) {
      console.error('Failed to fetch delivery man profile:', error)
    }
  }

  useEffect(() => {
    // Check if opened from QR scan
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('scanned') === 'true') {
      toast.success('Order found via QR scan!')
    }
  }, [location])

  // Close WhatsApp language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWhatsAppLanguage && !event.target.closest('.relative')) {
        setShowWhatsAppLanguage(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showWhatsAppLanguage])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/delivery/orders/${orderId}`)
      const orderData = res.data
      
      // Check if there's an assignment warning
      if (orderData._assignmentWarning) {
        toast.error(orderData._assignmentWarning, { duration: 5000 })
        // Remove the warning flag from the order object
        delete orderData._assignmentWarning
      }
      
      setOrder(orderData)
      setDeliveryStatus(orderData.deliveryStatus || 'pending')
      setDeliveryNotes(orderData.deliveryNotes || '')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load order'
      toast.error(errorMessage)
      if (error.response?.status === 404 || error.response?.status === 403) {
        setTimeout(() => {
          navigate('/delivery/dashboard')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!deliveryStatus) {
      toast.error('Please select a status')
      return
    }

    try {
      setUpdating(true)
      const res = await api.put(`/delivery/orders/${orderId}/status`, {
        deliveryStatus,
        deliveryNotes: deliveryNotes.trim() || undefined
      })

      setOrder(res.data.order)
      toast.success('Status updated successfully!')
      
      if (deliveryStatus === 'delivered' || deliveryStatus === 'failed') {
        setTimeout(() => {
          navigate('/delivery/dashboard')
        }, 2000)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'on_the_way':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A'
    return phone
  }

  const getWhatsAppMessage = (lang) => {
    const customerName = order?.user?.name || order?.paymentDetails?.customerName || 'Customer'
    const deliveryPhone = deliveryMan?.phone || 'N/A'
    const orderIdShort = order?._id?.slice(-8).toUpperCase() || 'N/A'

    const messages = {
      en: `Hello ${customerName}! 👋

✅ Your order #${orderIdShort} has been received and is ready for delivery.

📦 Our delivery person will contact you soon to arrange delivery.

📞 For any questions, you can contact the delivery person directly at:
${deliveryPhone}

Thank you for your order!
Find Store Team 🛍️`,
      ar: `مرحبا ${customerName}! 👋

✅ تم استلام طلبك رقم #${orderIdShort} وهو جاهز للتسليم.

📦 سيتواصل معك الشخص المسؤول عن التسليم قريباً لترتيب عملية التسليم.

📞 لأي استفسارات، يمكنك الاتصال بالشخص المسؤول عن التسليم مباشرة على:
${deliveryPhone}

شكراً لطلبك!
فريق Find Store 🛍️`,
      fr: `Bonjour ${customerName}! 👋

✅ Votre commande #${orderIdShort} a été reçue et est prête à être livrée.

📦 Notre livreur vous contactera bientôt pour organiser la livraison.

📞 Pour toute question, vous pouvez contacter le livreur directement au:
${deliveryPhone}

Merci pour votre commande!
Équipe Find Store 🛍️`
    }
    return messages[lang] || messages.en
  }

  const handleCall = () => {
    const phone = order?.user?.phone || order?.paymentDetails?.customerPhone
    if (phone) {
      window.location.href = `tel:${phone}`
    } else {
      toast.error('Phone number not available')
    }
  }

  const handleSMS = () => {
    const phone = order?.user?.phone || order?.paymentDetails?.customerPhone
    if (phone) {
      window.location.href = `sms:${phone}`
    } else {
      toast.error('Phone number not available')
    }
  }

  const handleWhatsApp = (selectedLang = language) => {
    const phone = order?.user?.phone || order?.paymentDetails?.customerPhone
    if (!phone) {
      toast.error('Phone number not available')
      return
    }

    const message = getWhatsAppMessage(selectedLang)
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
    setShowWhatsAppLanguage(false)
    toast.success('Opening WhatsApp...')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Order not found</p>
          <button
            onClick={() => navigate('/delivery/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/delivery/dashboard')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">Order Details</h1>
            <div className="w-9"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
        {/* Order Info Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Order ID</div>
              <div className="font-mono font-bold text-gray-900">#{order._id.slice(-12).toUpperCase()}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.deliveryStatus || 'pending')}`}>
              {order.deliveryStatus ? order.deliveryStatus.replace('_', ' ').toUpperCase() : 'PENDING'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Total Amount</div>
              <div className="font-bold text-lg text-gray-900">{formatCurrency(order.totalAmount)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Payment Method</div>
              <div className="font-semibold text-gray-900">
                {order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {order.user?.image && (
                <img
                  src={order.user.image}
                  alt={order.user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{order.user?.name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{order.user?.email || ''}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">{formatPhoneNumber(order.user?.phone || order.paymentDetails?.customerPhone)}</span>
                </div>
                
                {/* Communication Buttons */}
                <div className="flex items-center gap-2">
                  {/* Call Button */}
                  <button
                    onClick={handleCall}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Call Customer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>

                  {/* WhatsApp Button with Language Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowWhatsAppLanguage(!showWhatsAppLanguage)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Send WhatsApp Message"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                    
                    {/* Language Dropdown */}
                    {showWhatsAppLanguage && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 min-w-[200px]">
                        <div className="text-xs font-semibold text-gray-600 mb-2 px-2">Select Language:</div>
                        <button
                          onClick={() => handleWhatsApp('en')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2"
                        >
                          <span className="text-base">🇬🇧</span> English
                        </button>
                        <button
                          onClick={() => handleWhatsApp('ar')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2"
                        >
                          <span className="text-base">🇸🇦</span> العربية
                        </button>
                        <button
                          onClick={() => handleWhatsApp('fr')}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-2"
                        >
                          <span className="text-base">🇫🇷</span> Français
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SMS Button */}
                  <button
                    onClick={handleSMS}
                    className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Send SMS"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  {order.shippingAddress?.street && <div>{order.shippingAddress.street}</div>}
                  <div>
                    {[
                      order.shippingAddress?.city,
                      order.shippingAddress?.state,
                      order.shippingAddress?.zipCode
                    ].filter(Boolean).join(', ')}
                  </div>
                  {order.shippingAddress?.country && <div>{order.shippingAddress.country}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Notes Card */}
        {order.internalNotes && (
          <div className="bg-indigo-50 rounded-lg p-4 shadow-sm border border-indigo-200">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Internal Notes (from Moderator/Admin)
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-indigo-200 text-sm">
              {order.internalNotes}
            </p>
            {order.changeHistory && order.changeHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-200">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Recent Changes:</h3>
                <div className="space-y-2">
                  {order.changeHistory.slice(-2).reverse().map((change, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {change.changedBy?.name || 'System'} ({change.changedBy?.role || 'N/A'})
                        </span>
                        <span className="text-gray-500">
                          {new Date(change.changedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-600 mt-1">
                        {change.action.replace('_', ' ')}: {change.notes || 'No details'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{item.product?.name || 'Product'}</div>
                  <div className="text-sm text-gray-600">
                    Quantity: {item.quantity} × {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="font-bold text-gray-900">{formatCurrency(item.quantity * item.price)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Man Information Card */}
        {order.assignedDeliveryMan && (
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Assigned Delivery Man
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {order.assignedDeliveryMan.image && (
                  <img
                    src={order.assignedDeliveryMan.image}
                    alt={order.assignedDeliveryMan.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{order.assignedDeliveryMan.name || 'N/A'}</div>
                  {order.assignedDeliveryMan.email && (
                    <div className="text-sm text-gray-600">{order.assignedDeliveryMan.email}</div>
                  )}
                </div>
              </div>
              {order.assignedDeliveryMan.phone && (
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="font-medium text-gray-700">{order.assignedDeliveryMan.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Call Button */}
                    <a
                      href={`tel:${order.assignedDeliveryMan.phone}`}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      title="Call Delivery Man"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${order.assignedDeliveryMan.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      title="Chat on WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>

                    {/* SMS Button */}
                    <a
                      href={`sms:${order.assignedDeliveryMan.phone}`}
                      className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      title="Send SMS"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Update Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 sticky bottom-4">
          <h2 className="font-bold text-gray-900 mb-4">Update Delivery Status</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="on_the_way">On the Way</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Notes (Optional)
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about the delivery..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || !deliveryStatus}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryOrderDetail
