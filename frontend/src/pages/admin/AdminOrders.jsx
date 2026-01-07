import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import logoImage from '../../images/logo.png'

// Copy to clipboard function
const copyToClipboard = async (text, successMessage = 'Copied to clipboard!') => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
  } catch (error) {
    console.error('Failed to copy:', error)
    toast.error('Failed to copy to clipboard')
  }
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [deliveryMen, setDeliveryMen] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
    fetchDeliveryMen()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders')
      setOrders(res.data)
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryMen = async () => {
    try {
      const res = await api.get('/admin/delivery-men')
      setDeliveryMen(res.data)
    } catch (error) {
      console.error('Failed to fetch delivery men:', error)
    }
  }

  const handleUpdateStatus = async (orderId, orderStatus, paymentStatus, assignedDeliveryMan = undefined) => {
    try {
      const updateData = { orderStatus, paymentStatus }
      if (assignedDeliveryMan !== undefined) {
        updateData.assignedDeliveryMan = assignedDeliveryMan || null
      }
      await api.put(`/admin/orders/${orderId}`, updateData)
      toast.success('Order updated successfully')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order')
    }
  }

  const generateTicket = async (order) => {
    try {
      // Generate tracking number (using last 12 chars of order ID)
      const trackingNumber = order._id.slice(-12).toUpperCase()
      
      // Load logo image as data URL
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
        // Will use fallback circle if logo fails to load
      }
      
      // Generate QR Code with full order ID for delivery scanning
      let qrDataUrl
      try {
        // Use full order ID for QR code so delivery scanner can directly access the order
        qrDataUrl = await QRCode.toDataURL(order._id, {
          width: 200,
          margin: 1
        })
      } catch (error) {
        console.error('QR Code generation error:', error)
        // Fallback: create a simple text representation
        qrDataUrl = null
      }

      // Generate Barcode (using a canvas approach)
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

      // Header Section - Company Info
      doc.setFillColor(240, 240, 240)
      doc.rect(0, 0, pageWidth, 25, 'F')
      
      // Add logo image or fallback to circle
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 8, 16, 16)
      } else {
        // Fallback: Draw colored circle if logo fails to load
        doc.setFillColor(255, 56, 92) // #FF385C
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

      // QR Code and Tracking Number Section
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', margin, yPosition, 30, 30)
      } else {
        // Fallback: Draw a box for QR code
        doc.rect(margin, yPosition, 30, 30)
        doc.setFontSize(8)
        doc.text('QR', margin + 13, yPosition + 18, { align: 'center' })
      }
      
      // Tracking Number (large, prominent)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(trackingNumber, margin + 35, yPosition + 12)
      
      // Barcode
      if (barcodeDataUrl) {
        doc.addImage(barcodeDataUrl, 'PNG', margin + 35, yPosition + 18, 120, 15)
      } else {
        // Fallback: Draw tracking number as barcode placeholder
        doc.setFontSize(10)
        doc.text(trackingNumber, margin + 35, yPosition + 25)
      }

      yPosition += 35

      // Destination Section
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(': Destination', pageWidth - margin - 25, yPosition, { align: 'right' })
      yPosition += 6

      // Recipient Information
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const recipientName = order.paymentDetails?.customerName || order.user?.name || 'N/A'
      doc.text(recipientName, margin, yPosition)
      yPosition += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Address
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

      // Phone
      const recipientPhone = order.paymentDetails?.customerPhone || order.user?.phone || 'N/A'
      doc.text(recipientPhone, margin, yPosition)
      yPosition += 8

      // Product Description
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

      // Payment Information (if COD)
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

      // Separator
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8

      // Original/Sender Section
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

      // Date
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      doc.setFont('helvetica', 'bold')
      doc.text(orderDate, pageWidth - margin, yPosition, { align: 'right' })

      // Save the PDF
      const fileName = `Shipping-Label-${trackingNumber}.pdf`
      doc.save(fileName)
      
      toast.success('Shipping label generated and downloaded successfully!')
    } catch (error) {
      console.error('Error generating ticket:', error)
      toast.error('Failed to generate shipping label. Please try again.')
    }
  }


  const handleToggleOrderDetails = (orderId) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o._id)))
    }
  }

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = !searchQuery || 
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.paymentDetails?.customerName?.toLowerCase().includes(searchQuery.toLowerCase()))

    // Order status filter
    const matchesOrderStatus = orderStatusFilter === 'all' || order.orderStatus === orderStatusFilter

    // Payment status filter
    const matchesPaymentStatus = paymentStatusFilter === 'all' || 
      (paymentStatusFilter === 'paid' && order.paymentStatus === 'paid') ||
      (paymentStatusFilter === 'pending' && (!order.paymentStatus || order.paymentStatus === 'pending'))

    return matchesSearch && matchesOrderStatus && matchesPaymentStatus
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Management</h1>
              <p className="text-sm text-gray-600">Manage and track all customer orders in your store</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="text-xs text-blue-600 font-medium uppercase tracking-wider">Total Orders</div>
                <div className="text-2xl font-bold text-blue-700">{orders.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Orders</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID, Customer Name, Email..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Order Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order Status</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-gray-900">{filteredOrders.length}</span> of <span className="font-semibold text-gray-900">{orders.length}</span> orders
            </span>
            {(searchQuery || orderStatusFilter !== 'all' || paymentStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setOrderStatusFilter('all')
                  setPaymentStatusFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
              {selectedOrders.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedOrders.size} selected
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500">
                              {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {orders.length === 0 
                                ? 'Orders will appear here once customers place them'
                                : 'Try adjusting your search or filter criteria'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <>
                        <tr key={order._id} className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order._id)}
                              onChange={() => handleSelectOrder(order._id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-semibold text-gray-900">
                                #{order._id.slice(-8)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(order._id, 'Order ID copied!')}
                                className="group relative p-1.5 rounded-lg hover:bg-blue-100 transition-all duration-200"
                                title="Copy Order ID"
                              >
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  Copy ID
                                </span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {order.user?.image ? (
                                <img
                                  src={order.user.image}
                                  alt={order.user.name}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border border-gray-200">
                                  <span className="text-white text-xs font-semibold">
                                    {(order.user?.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{order.user?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${
                              order.orderStatus === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' :
                              order.orderStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              order.orderStatus === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              order.orderStatus === 'shipped' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-md ${
                              order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                              order.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}>
                              {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                                onClick={() => handleToggleOrderDetails(order._id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              >
                                {expandedOrders.has(order._id) ? (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    View
                                  </>
                                )}
                            </button>
                          </td>
                        </tr>
                          {expandedOrders.has(order._id) && (
                            <tr>
                              <td colSpan="8" className="px-6 py-6 bg-gray-50">
                              <div className="space-y-6">
                                {/* Order Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Order ID</p>
                                        <p className="font-mono font-semibold text-gray-900">#{order._id.slice(-8)}</p>
          </div>
                  <button
                                        onClick={() => copyToClipboard(order._id, 'Order ID copied!')}
                                        className="group relative p-2 rounded-lg bg-[#FF385C]/10 hover:bg-[#FF385C]/20 transition-all duration-200"
                                        title="Copy Order ID"
                  >
                                        <svg className="w-4 h-4 text-[#FF385C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                  </div>
                                  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Customer</p>
                                    <div className="flex items-center gap-2">
                                      {order.user?.image && (
                                        <img 
                                          src={order.user.image} 
                                          alt={order.user.name}
                                          className="w-8 h-8 rounded-full object-cover"
                                          onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/32?text=U'
                                          }}
                                        />
                                      )}
                                      <div>
                                        <p className="font-semibold text-gray-900">{order.user?.name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500 mt-1">{order.user?.email || ''}</p>
                                      </div>
                                    </div>
                  </div>
                                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm">
                    <p className="text-xs text-orange-700 mb-1">Total Amount</p>
                                    <p className="font-bold text-2xl text-orange-900">{formatCurrency(order.totalAmount)}</p>
                  </div>
                                  <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Order Date</p>
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {new Date(order.createdAt).toLocaleString('en-US', { 
                        year: 'numeric', 
                                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                                </div>
                                {/* Customer Information Section */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Customer Information</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* User Profile */}
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                      <div className="flex items-start gap-4">
                                        {order.user?.image ? (
                                          <img 
                                            src={order.user.image} 
                                            alt={order.user.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/64?text=U'
                                            }}
                                          />
                                        ) : (
                                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center border-2 border-white shadow-md">
                                            <span className="text-white font-bold text-xl">
                                              {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-900 mb-1">{order.user?.name || 'N/A'}</h4>
                                          <p className="text-sm text-gray-600 mb-2">{order.user?.email || 'N/A'}</p>
                                          {(order.user?.phone || order.paymentDetails?.customerPhone) && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="text-sm font-medium text-gray-700">
                                                {order.user?.phone || order.paymentDetails?.customerPhone}
                                              </p>
                                              <div className="flex items-center gap-1">
                                                {/* WhatsApp */}
                                                <a
                                                  href={`https://wa.me/${(order.user?.phone || order.paymentDetails?.customerPhone || '').replace(/[^0-9]/g, '')}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                                                  title="Chat on WhatsApp"
                                                >
                                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                  </svg>
                                                </a>
                                                {/* Call */}
                                                <a
                                                  href={`tel:${order.user?.phone || order.paymentDetails?.customerPhone}`}
                                                  className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                                                  title="Make a phone call"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                  </svg>
                                                </a>
                                                {/* SMS */}
                                                <a
                                                  href={`sms:${order.user?.phone || order.paymentDetails?.customerPhone}`}
                                                  className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                                                  title="Send SMS"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* User Address from Profile */}
                                    {order.user?.address && (order.user.address.street || order.user.address.city) && (
                                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          Profile Address
                                        </h4>
                                        <div className="text-sm text-gray-700 space-y-1">
                                          {order.user.address.street && <p>{order.user.address.street}</p>}
                                          <p>
                                            {order.user.address.city && `${order.user.address.city}, `}
                                            {order.user.address.state && `${order.user.address.state} `}
                                            {order.user.address.zipCode && `${order.user.address.zipCode}`}
                                          </p>
                                          {order.user.address.country && <p>{order.user.address.country}</p>}
                                        </div>
                                      </div>
                                    )}

                                    {/* Contact Info from Payment Details (for COD) */}
                                    {order.paymentDetails?.customerName && (
                                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          Delivery Contact (COD)
                                        </h4>
                                        <div className="text-sm text-gray-700 space-y-2">
                                          <p className="font-medium">{order.paymentDetails.customerName}</p>
                                          {order.paymentDetails.customerPhone && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="font-medium text-gray-700">{order.paymentDetails.customerPhone}</p>
                                              <div className="flex items-center gap-1">
                                                {/* WhatsApp */}
                                                <a
                                                  href={`https://wa.me/${order.paymentDetails.customerPhone.replace(/[^0-9]/g, '')}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Chat on WhatsApp"
                                                >
                                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                  </svg>
                                                </a>
                                                {/* Call */}
                                                <a
                                                  href={`tel:${order.paymentDetails.customerPhone}`}
                                                  className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Make a phone call"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                  </svg>
                                                </a>
                                                {/* SMS */}
                                                <a
                                                  href={`sms:${order.paymentDetails.customerPhone}`}
                                                  className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Send SMS"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Customer Information Section */}
                                    {order.user && (
                                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          Customer Information
                                        </h4>
                                        <div className="text-sm text-gray-700 space-y-2">
                                          {order.user.image && (
                                            <div className="flex items-center gap-3 mb-3">
                                              <img 
                                                src={order.user.image} 
                                                alt={order.user.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                                                onError={(e) => {
                                                  e.target.src = 'https://via.placeholder.com/48?text=U'
                                                }}
                                              />
                                              <div>
                                                <p className="font-semibold text-gray-900">{order.user.name}</p>
                                                <p className="text-xs text-gray-500">{order.user.email}</p>
                                              </div>
                                            </div>
                                          )}
                                          {!order.user.image && (
                                            <div>
                                              <p className="font-semibold text-gray-900 mb-1">{order.user.name}</p>
                                              <p className="text-xs text-gray-500 mb-2">{order.user.email}</p>
                                            </div>
                                          )}
                                          {(order.user.phone || order.paymentDetails?.customerPhone) && (
                                            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-blue-200">
                                              <p className="font-medium text-gray-700">
                                                {order.user.phone || order.paymentDetails?.customerPhone}
                                              </p>
                                              <div className="flex items-center gap-1">
                                                {/* WhatsApp */}
                                                <a
                                                  href={`https://wa.me/${(order.user.phone || order.paymentDetails?.customerPhone || '').replace(/[^0-9]/g, '')}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Chat on WhatsApp"
                                                >
                                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                  </svg>
                                                </a>
                                                {/* Call */}
                                                <a
                                                  href={`tel:${order.user.phone || order.paymentDetails?.customerPhone}`}
                                                  className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Make a phone call"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                  </svg>
                                                </a>
                                                {/* SMS */}
                                                <a
                                                  href={`sms:${order.user.phone || order.paymentDetails?.customerPhone}`}
                                                  className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                  title="Send SMS"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Items</h3>
                                  <div className="space-y-3">
                                    {order.items?.map((item, index) => (
                                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        {item.product?.images?.[0] && (
                                          <img 
                                            src={item.product.images[0]} 
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                            onError={(e) => {
                                              e.target.src = 'https://via.placeholder.com/80?text=No+Image'
                                            }}
                                          />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 text-base">{item.product?.name || 'Product'}</p>
                                          <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity} × {formatCurrency(item.price)}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-gray-900 text-lg">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                  <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-200">
                                    <button
                                      onClick={() => generateTicket(order)}
                                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Generate Ticket (PDF)
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const trackingNumber = order._id.slice(-12).toUpperCase()
                                        const printWindow = window.open('', '_blank')
                                        
                                        // Load logo image as data URL
                                        let logoImgHtml = '<div style="width: 30px; height: 30px; background: #FF385C; border-radius: 50%; display: inline-block;"></div>'
                                        try {
                                          const img = new Image()
                                          img.crossOrigin = 'anonymous'
                                          await new Promise((resolve, reject) => {
                                            img.onload = () => {
                                              try {
                                                const canvas = document.createElement('canvas')
                                                canvas.width = img.width
                                                canvas.height = img.height
                                                const ctx = canvas.getContext('2d')
                                                ctx.drawImage(img, 0, 0)
                                                logoImgHtml = `<img src="${canvas.toDataURL('image/png')}" style="width: 30px; height: 30px; object-fit: contain; border-radius: 50%;" alt="Logo" />`
                                                resolve()
                                              } catch (error) {
                                                reject(error)
                                              }
                                            }
                                            img.onerror = reject
                                            img.src = logoImage
                                          })
                                        } catch (error) {
                                          console.error('Logo loading error:', error)
                                          // Use fallback circle
                                        }
                                        
                                        // Generate QR Code for print
                                        let qrCodeImg = ''
                                        try {
                                          const qrDataUrl = await QRCode.toDataURL(trackingNumber, {
                                            width: 150,
                                            margin: 1
                                          })
                                          qrCodeImg = `<img src="${qrDataUrl}" style="width: 120px; height: 120px;" alt="QR Code" />`
                                        } catch (error) {
                                          qrCodeImg = '<div style="width: 120px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 12px;">QR Code</div>'
                                        }

                                        // Generate Barcode for print
                                        let barcodeImg = ''
                                        try {
                                          const jsbarcodeModule = await import('jsbarcode')
                                          const JsBarcodeFunc = jsbarcodeModule.default || jsbarcodeModule
                                          const canvas = document.createElement('canvas')
                                          JsBarcodeFunc(canvas, trackingNumber, {
                                            format: 'CODE128',
                                            width: 2,
                                            height: 60,
                                            displayValue: true,
                                            fontSize: 16,
                                            margin: 2
                                          })
                                          barcodeImg = `<img src="${canvas.toDataURL('image/png')}" style="width: 100%; max-width: 400px; height: auto;" alt="Barcode" />`
                                        } catch (error) {
                                          console.error('Barcode generation error:', error)
                                          barcodeImg = `<div style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">${trackingNumber}</div>`
                                        }

                                        printWindow.document.write(`
                                          <!DOCTYPE html>
                                          <html>
                                            <head>
                                              <title>Shipping Label - ${trackingNumber}</title>
                                              <style>
                                                @media print {
                                                  body { margin: 0; padding: 10px; }
                                                  .no-print { display: none; }
                                                  @page { size: A4; margin: 10mm; }
                                                }
                                                body { font-family: Arial, sans-serif; padding: 20px; margin: 0; max-width: 210mm; }
                                                .label-container { border: 2px solid #000; padding: 15px; background: white; }
                                                .header { display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 2px solid #000; margin-bottom: 15px; }
                                                .logo { width: 30px; height: 30px; display: inline-block; }
                                                .company-info { flex: 1; }
                                                .company-name { font-size: 14px; font-weight: bold; margin: 0; }
                                                .company-details { font-size: 11px; color: #666; margin: 2px 0; }
                                                .tracking-section { display: flex; gap: 20px; margin: 15px 0; padding: 15px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
                                                .qr-section { display: flex; align-items: center; }
                                                .tracking-info { flex: 1; }
                                                .tracking-number { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
                                                .barcode-section { margin: 10px 0; }
                                                .section { margin: 15px 0; padding: 10px 0; }
                                                .section-label { font-size: 11px; font-weight: bold; text-align: right; float: right; margin-top: -5px; }
                                                .section-content { clear: both; }
                                                .recipient-name { font-size: 14px; font-weight: bold; margin: 5px 0; }
                                                .address-line { font-size: 11px; margin: 3px 0; line-height: 1.4; }
                                                .product-description { font-size: 11px; margin: 10px 0; }
                                                .payment-info { font-size: 12px; font-weight: bold; margin: 10px 0; }
                                                .sender-section { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px; }
                                                .sender-name { font-size: 13px; font-weight: bold; margin: 5px 0; }
                                                .date-print { text-align: right; font-weight: bold; font-size: 11px; margin-top: 10px; }
                                              </style>
                                            </head>
                                            <body>
                                              <div class="label-container">
                                                <!-- Header -->
                                                <div class="header">
                                                  <div class="logo">${logoImgHtml}</div>
                                                  <div class="company-info">
                                                    <div class="company-name">FIND STORE</div>
                                                    <div class="company-details">Delivery Service</div>
                                                    <div class="company-details">+212 707625535</div>
                                                  </div>
                                                </div>

                                                <!-- Tracking Section -->
                                                <div class="tracking-section">
                                                  <div class="qr-section">
                                                    ${qrCodeImg}
                                                  </div>
                                                  <div class="tracking-info">
                                                    <div class="tracking-number">${trackingNumber}</div>
                                                    <div class="barcode-section">
                                                      ${barcodeImg}
                                                    </div>
                                                  </div>
                                                </div>

                                                <!-- Destination Section -->
                                                <div class="section">
                                                  <span class="section-label">: Destination</span>
                                                  <div class="section-content">
                                                    <div class="recipient-name">${order.paymentDetails?.customerName || order.user?.name || 'N/A'}</div>
                                                    ${order.shippingAddress?.street ? `<div class="address-line">${order.shippingAddress.street}</div>` : ''}
                                                    <div class="address-line">
                                                      ${[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(' - ')}${order.shippingAddress?.zipCode ? ' ' + order.shippingAddress.zipCode : ''}
                                                    </div>
                                                    <div class="address-line">${order.shippingAddress?.country || ''}</div>
                                                    <div class="address-line" style="margin-top: 8px;">${order.paymentDetails?.customerPhone || order.user?.phone || 'N/A'}</div>
                                                    
                                                    <div class="product-description">
                                                      <strong>Nature de produit:</strong><br>
                                                      ${order.items?.map(item => `${item.product?.name || 'Product'} (Qty: ${item.quantity})`).join('; ') || 'N/A'}
                                                    </div>
                                                    
                                                    ${order.paymentMethod === 'cash' ? `
                                                      <div class="payment-info">
                                                        Paiement à la livraison: ${formatCurrency(order.totalAmount)}
                                                      </div>
                                                    ` : ''}
                                                  </div>
                                                </div>

                                                <!-- Original/Sender Section -->
                                                <div class="sender-section">
                                                  <span class="section-label">: Original</span>
                                                  <div class="section-content">
                                                    <div class="sender-name">Find Store</div>
                                                    <div class="address-line">Morocco</div>
                                                    <div class="address-line">+212 707625535</div>
                                                    <div class="date-print">${new Date(order.createdAt).toISOString().split('T')[0]}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            </body>
                                          </html>
                                        `)
                                        printWindow.document.close()
                                        setTimeout(() => {
                                          printWindow.print()
                                        }, 500)
                                      }}
                                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print Ticket
                                    </button>
                                  </div>
                                  
                                  <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                                        value={order.orderStatus}
                                        onChange={(e) => handleUpdateStatus(order._id, e.target.value, order.paymentStatus)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Status
                    </label>
                    <select
                                        value={order.paymentStatus}
                                        onChange={(e) => handleUpdateStatus(order._id, order.orderStatus, e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                </div>
                                    <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assign Delivery Man
                    </label>
                    <select
                                        value={order.assignedDeliveryMan?._id || ''}
                                        onChange={(e) => handleUpdateStatus(order._id, order.orderStatus, order.paymentStatus, e.target.value || null)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                    >
                      <option value="">None (Unassigned)</option>
                      {deliveryMen.map((deliveryMan) => (
                        <option key={deliveryMan._id} value={deliveryMan._id}>
                          {deliveryMan.name} {deliveryMan.phone ? `(${deliveryMan.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    {order.assignedDeliveryMan && (
                      <p className="text-xs text-gray-500 mt-1">
                        Currently assigned to: <span className="font-semibold">{order.assignedDeliveryMan.name}</span>
                      </p>
                    )}
                </div>

                                    {/* Shipping Address */}
                                    {order.shippingAddress && (
                                      <div className="md:col-span-2">
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Shipping Address
                                          </h3>
                                          <div className="text-sm text-gray-700 space-y-1">
                                            {order.shippingAddress.street && <p className="font-medium">{order.shippingAddress.street}</p>}
                                            <p>
                                              {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                                              {order.shippingAddress.state && `${order.shippingAddress.state} `}
                                              {order.shippingAddress.zipCode && `${order.shippingAddress.zipCode}`}
                                            </p>
                                            {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Payment Information */}
                                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        Payment Information
                                      </h4>
                                      <div className="text-sm text-gray-700 space-y-1">
                                        <p><span className="font-medium">Method:</span> <span className="capitalize">{order.paymentMethod || 'card'}</span></p>
                                        <p><span className="font-medium">Status:</span> <span className={`capitalize ${
                                          order.paymentStatus === 'paid' ? 'text-green-600' :
                                          order.paymentStatus === 'failed' ? 'text-red-600' :
                                          'text-yellow-600'
                                        }`}>{order.paymentStatus || 'pending'}</span></p>
                                        {order.paymentDetails?.last4 && (
                                          <p><span className="font-medium">Card:</span> ****{order.paymentDetails.last4}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Internal Notes */}
                                    <div className="md:col-span-2 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Internal Notes
                                        {order.assignedDeliveryMan && (
                                          <span className="text-xs font-normal text-gray-600 ml-2">
                                            (Visible to Admin, Moderator & Delivery)
                                          </span>
                                        )}
                                      </h4>
                                      <div className="text-sm text-gray-700">
                                        {order.internalNotes ? (
                                          <p className="whitespace-pre-wrap bg-white p-3 rounded border border-indigo-200">{order.internalNotes}</p>
                                        ) : (
                                          <p className="text-gray-500 italic">No internal notes</p>
                                        )}
                                      </div>
                                      {order.changeHistory && order.changeHistory.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-indigo-200">
                                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Recent Changes:</h5>
                                          <div className="space-y-2">
                                            {order.changeHistory.slice(-3).reverse().map((change, idx) => (
                                              <div key={idx} className="text-xs bg-white p-2 rounded border border-indigo-100">
                                                <div className="flex items-center justify-between">
                                                  <span className="font-medium text-gray-900">
                                                    {change.changedBy?.name || 'System'}
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
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                          )}
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
    </AdminLayout>
  )
}

export default AdminOrders
