import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

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
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [selectedOrders, setSelectedOrders] = useState(new Set())

  useEffect(() => {
    fetchOrders()
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

  const handleUpdateStatus = async (orderId, orderStatus, paymentStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, {
        orderStatus,
        paymentStatus
      })
      toast.success('Order status updated')
      fetchOrders()
    } catch (error) {
      toast.error('Failed to update order status')
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
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)))
    }
  }

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
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
        </div>

        <div className="space-y-6">
          {/* Orders List */}
          <div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
                <div>
                <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
                <p className="text-sm text-gray-600 mt-1">{orders.length} total orders</p>
                </div>
                {selectedOrders.size > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {selectedOrders.size} selected
                    </div>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.size === orders.length && orders.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm">No orders found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <>
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedOrders.has(order._id)}
                                onChange={() => handleSelectOrder(order._id)}
                                className="w-4 h-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-semibold text-gray-900">
                              #{order._id.slice(-8)}
                            </span>
                                <button
                                  onClick={() => copyToClipboard(order._id, 'Order ID copied!')}
                                  className="group relative p-1.5 rounded-lg hover:bg-[#FF385C]/10 transition-all duration-200 hover:scale-110 active:scale-95"
                                  title="Copy Order ID"
                                >
                                  <svg className="w-4 h-4 text-[#FF385C] group-hover:text-[#E61E4D] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    Copy ID
                                  </span>
                                </button>
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                              order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                              order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              order.orderStatus === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                onClick={() => handleToggleOrderDetails(order._id)}
                                className="text-[#FF385C] hover:text-[#E61E4D] font-semibold transition-colors flex items-center gap-1"
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
                              <td colSpan="7" className="px-6 py-6 bg-gray-50">
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
                                    <p className="font-semibold text-gray-900">{order.user?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{order.user?.email || ''}</p>
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
                                {/* Order Items */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                  <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                                  <div className="space-y-3">
                                    {order.items?.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                                          <p className="text-sm text-gray-600">Total: {formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Status Update */}
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
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

                                    {order.shippingAddress && (
                                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Shipping Address
                    </h3>
                                        <p className="text-sm text-gray-700">
                                          {order.shippingAddress.street && `${order.shippingAddress.street}, `}
                                          {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                                          {order.shippingAddress.state && `${order.shippingAddress.state} `}
                                          {order.shippingAddress.zipCode}
                                          {order.shippingAddress.country && `, ${order.shippingAddress.country}`}
                                        </p>
                                      </div>
                                    )}
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
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOrders
