import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

const DeliveryOrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('delivery_token')
    if (!token) {
      navigate('/delivery/login')
      return
    }

    fetchOrder()
  }, [orderId, navigate])

  useEffect(() => {
    // Check if opened from QR scan
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('scanned') === 'true') {
      toast.success('Order found via QR scan!')
    }
  }, [location])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/delivery/orders/${orderId}`)
      setOrder(res.data)
      setDeliveryStatus(res.data.deliveryStatus || 'pending')
      setDeliveryNotes(res.data.deliveryNotes || '')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load order')
      if (error.response?.status === 404) {
        navigate('/delivery/dashboard')
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
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">{formatPhoneNumber(order.user?.phone || order.paymentDetails?.customerPhone)}</span>
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
