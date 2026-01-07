import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import logoImage from '../../images/logo.png'
import ModeratorLayout from '../../components/ModeratorLayout'

const ModeratorOrders = () => {
  const [orders, setOrders] = useState([])
  const [deliveryMen, setDeliveryMen] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [assigningOrder, setAssigningOrder] = useState(null)
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('moderator_token')
    if (!token) {
      navigate('/moderator/login')
      return
    }

    fetchOrders()
    fetchDeliveryMen()
  }, [navigate])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/moderator/orders')
      setOrders(res.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('moderator_token')
        localStorage.removeItem('moderator_user')
        navigate('/moderator/login')
        toast.error('Session expired. Please login again.', { duration: 5000 })
      } else {
        toast.error('Failed to fetch orders')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryMen = async () => {
    try {
      const res = await api.get('/moderator/delivery-men')
      setDeliveryMen(res.data)
    } catch (error) {
      console.error('Failed to fetch delivery men:', error)
    }
  }

  const handleVerifyOrder = async (orderId, status) => {
    try {
      await api.put(`/moderator/orders/${orderId}/verify`, {
        orderStatus: status,
        internalNotes: orders.find(o => o._id === orderId)?.internalNotes || ''
      })
      toast.success(status === 'confirmed' ? 'Order verified and confirmed!' : 'Order cancelled')
      fetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify order')
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/moderator/orders/${orderId}/status`, {
        orderStatus: newStatus,
        internalNotes: orders.find(o => o._id === orderId)?.internalNotes || ''
      })
      toast.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status')
    }
  }

  const handleAssignDeliveryMan = async (orderId) => {
    if (!selectedDeliveryMan) {
      toast.error('Please select a delivery man')
      return
    }

    try {
      await api.put(`/moderator/orders/${orderId}/assign`, {
        assignedDeliveryMan: selectedDeliveryMan,
        internalNotes: orders.find(o => o._id === orderId)?.internalNotes || ''
      })
      toast.success('Order assigned to delivery man successfully')
      setAssigningOrder(null)
      setSelectedDeliveryMan('')
      fetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign delivery man')
    }
  }

  const handleSaveNotes = async (orderId) => {
    try {
      await api.put(`/moderator/orders/${orderId}/notes`, {
        internalNotes: notesText
      })
      toast.success('Internal notes saved successfully')
      setEditingNotes(null)
      setNotesText('')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to save notes')
    }
  }

  const toggleOrderExpand = (orderId) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const generateTicket = async (order) => {
    try {
      const trackingNumber = order._id.slice(-12).toUpperCase()
      
      let logoDataUrl = null
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        logoDataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)
              resolve(canvas.toDataURL('image/png'))
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = reject
          img.src = logoImage
        })
      } catch (error) {
        console.error('Logo loading error:', error)
      }
      
      let qrDataUrl
      try {
        qrDataUrl = await QRCode.toDataURL(order._id, {
          width: 200,
          margin: 1
        })
      } catch (error) {
        console.error('QR Code generation error:', error)
        qrDataUrl = null
      }

      let barcodeDataUrl = null
      try {
        if (typeof window !== 'undefined') {
          const jsbarcodeModule = await import('jsbarcode')
          const JsBarcodeFunc = jsbarcodeModule.default || jsbarcodeModule
          const canvas = document.createElement('canvas')
          JsBarcodeFunc(canvas, trackingNumber, {
            format: 'CODE128',
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 14,
            margin: 2
          })
          barcodeDataUrl = canvas.toDataURL('image/png')
        }
      } catch (error) {
        console.error('Barcode generation error:', error)
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 15
      let yPosition = margin

      doc.setFillColor(240, 240, 240)
      doc.rect(0, 0, pageWidth, 25, 'F')
      
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 8, 16, 16)
      } else {
        doc.setFillColor(99, 102, 241)
        doc.circle(20, 12, 8, 'F')
      }
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('FIND STORE', 32, 10)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Delivery Service', 32, 16)
      doc.text('+212 707625535', 32, 21)

      yPosition = 30

      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', margin, yPosition, 30, 30)
      } else {
        doc.rect(margin, yPosition, 30, 30)
        doc.setFontSize(8)
        doc.text('QR', margin + 13, yPosition + 18, { align: 'center' })
      }
      
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(trackingNumber, margin + 35, yPosition + 12)
      
      if (barcodeDataUrl) {
        doc.addImage(barcodeDataUrl, 'PNG', margin + 35, yPosition + 18, 120, 15)
      } else {
        doc.setFontSize(10)
        doc.text(trackingNumber, margin + 35, yPosition + 25)
      }

      yPosition += 35

      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(': Destination', pageWidth - margin - 25, yPosition, { align: 'right' })
      yPosition += 6

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const recipientName = order.paymentDetails?.customerName || order.user?.name || 'N/A'
      doc.text(recipientName, margin, yPosition)
      yPosition += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      if (order.shippingAddress) {
        if (order.shippingAddress.street) {
          doc.text(order.shippingAddress.street, margin, yPosition)
          yPosition += 5
        }
        const cityState = [
          order.shippingAddress.city,
          order.shippingAddress.state
        ].filter(Boolean).join(' - ')
        if (cityState) {
          doc.text(cityState, margin, yPosition)
          yPosition += 5
        }
      }

      const recipientPhone = order.paymentDetails?.customerPhone || order.user?.phone || 'N/A'
      doc.text(recipientPhone, margin, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Nature de produit:', margin, yPosition)
      yPosition += 5
      
      doc.setFont('helvetica', 'normal')
      const productDescriptions = order.items?.map(item => {
        const name = item.product?.name || 'Product'
        return `${name} (Qty: ${item.quantity})`
      }).join('; ') || 'N/A'
      doc.text(productDescriptions, margin, yPosition)
      yPosition += 8

      if (order.paymentMethod === 'cash') {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Paiement à la livraison:', margin, yPosition)
        yPosition += 5
        doc.setFontSize(12)
        doc.text(`${formatCurrency(order.totalAmount)}`, margin, yPosition)
        yPosition += 10
      } else {
        yPosition += 5
      }

      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(': Original', pageWidth - margin - 20, yPosition, { align: 'right' })
      yPosition += 6

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Find Store', margin, yPosition)
      yPosition += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Morocco', margin, yPosition)
      yPosition += 5
      doc.text('+212 707625535', margin, yPosition)
      yPosition += 5

      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      doc.setFont('helvetica', 'bold')
      doc.text(orderDate, pageWidth - margin, yPosition, { align: 'right' })

      const fileName = `Shipping-Label-${trackingNumber}.pdf`
      doc.save(fileName)
      
      toast.success('Shipping label generated successfully!')
    } catch (error) {
      console.error('Error generating ticket:', error)
      toast.error('Failed to generate shipping label')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter
    const matchesVerification = 
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && order.verified) ||
      (verificationFilter === 'unverified' && !order.verified)

    return matchesSearch && matchesStatus && matchesVerification
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <ModeratorLayout>
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, name, email, phone..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verification
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrderExpand(order._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order ID</p>
                        <p className="text-lg font-bold text-gray-900">{order._id.slice(-12).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Customer</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {order.user?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-lg font-bold text-indigo-600">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      {order.verified && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-green-600">Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrders.has(order._id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedOrders.has(order._id) && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer Information */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                        <div className="space-y-2">
                          <p><span className="font-semibold">Name:</span> {order.user?.name || 'N/A'}</p>
                          <p><span className="font-semibold">Email:</span> {order.user?.email || 'N/A'}</p>
                          <p><span className="font-semibold">Phone:</span> {order.user?.phone || 'N/A'}</p>
                          {order.shippingAddress && (
                            <div>
                              <p className="font-semibold">Address:</p>
                              <p className="text-gray-700">
                                {[
                                  order.shippingAddress.street,
                                  order.shippingAddress.city,
                                  order.shippingAddress.state,
                                  order.shippingAddress.zipCode
                                ].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
                        <div className="space-y-2">
                          <p><span className="font-semibold">Payment Method:</span> {order.paymentMethod === 'cash' ? 'Cash on Delivery' : order.paymentMethod}</p>
                          <p><span className="font-semibold">Payment Status:</span> {order.paymentStatus}</p>
                          <p><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleString()}</p>
                          {order.assignedDeliveryMan && (
                            <p><span className="font-semibold">Assigned To:</span> {order.assignedDeliveryMan?.name || 'N/A'}</p>
                          )}
                        </div>
                      </div>

                      {/* Products */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Products</h3>
                        <div className="space-y-2">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-4">
                                {item.product?.images?.[0] && (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                )}
                                <div>
                                  <p className="font-semibold">{item.product?.name || 'Product'}</p>
                                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-bold text-indigo-600">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-300">
                            <p className="text-lg font-bold">Total:</p>
                            <p className="text-xl font-bold text-indigo-600">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Internal Notes */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Internal Notes</h3>
                          {editingNotes !== order._id && (
                            <button
                              onClick={() => {
                                setEditingNotes(order._id)
                                setNotesText(order.internalNotes || '')
                              }}
                              className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              {order.internalNotes ? 'Edit Notes' : 'Add Notes'}
                            </button>
                          )}
                        </div>
                        {editingNotes === order._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Add internal notes (visible only to admin and moderators)..."
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleSaveNotes(order._id)}
                                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                Save Notes
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNotes(null)
                                  setNotesText('')
                                }}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {order.internalNotes || 'No internal notes'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Verification Actions */}
                          {!order.verified && order.orderStatus === 'new' && (
                            <>
                              <button
                                onClick={() => handleVerifyOrder(order._id, 'confirmed')}
                                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Verify & Confirm
                              </button>
                              <button
                                onClick={() => handleVerifyOrder(order._id, 'cancelled')}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel Order
                              </button>
                            </>
                          )}

                          {/* Status Change */}
                          {order.orderStatus !== 'cancelled' && (
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="new">New</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          )}

                          {/* Assign Delivery Man */}
                          {order.orderStatus === 'confirmed' && (
                            <div className="flex gap-2">
                              {assigningOrder === order._id ? (
                                <div className="flex gap-2 flex-1">
                                  <select
                                    value={selectedDeliveryMan}
                                    onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="">Select Delivery Man</option>
                                    {deliveryMen.map((dm) => (
                                      <option key={dm._id} value={dm._id}>
                                        {dm.name} {dm.phone ? `(${dm.phone})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleAssignDeliveryMan(order._id)}
                                    className="px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                  >
                                    Assign
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAssigningOrder(null)
                                      setSelectedDeliveryMan('')
                                    }}
                                    className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAssigningOrder(order._id)}
                                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 w-full"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  {order.assignedDeliveryMan ? 'Reassign' : 'Assign Delivery Man'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Generate Ticket */}
                          <button
                            onClick={() => generateTicket(order)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
    </ModeratorLayout>
  )
}

export default ModeratorOrders

