import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'amber' },
  { value: 'contacted', label: 'Contacted', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' }
]

const AdminRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/requests')
      setRequests(res.data)
    } catch (error) {
      toast.error('Failed to load order requests')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const res = await api.put(`/admin/requests/${id}`, { status: newStatus })
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data : r)))
      toast.success('Status updated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order request? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api.delete(`/admin/requests/${id}`)
      setRequests((prev) => prev.filter((r) => r._id !== id))
      toast.success('Request deleted')
    } catch (error) {
      toast.error('Failed to delete request')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRequests = requests.filter((req) => {
    const matchSearch =
      !searchQuery ||
      [
        req.customerName,
        req.customerPhone,
        req.city,
        req.address,
        req.product?.name
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    const matchStatus = statusFilter === 'all' || req.status === statusFilter
    return matchSearch && matchStatus
  })

  const newCount = requests.filter((r) => r.status === 'new').length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-[#FF385C]" />
          <p className="text-gray-600 font-medium mt-4">Loading order requests...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buy Now Orders</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Customer details from &quot;Buy now&quot; — contact and fulfill orders
            </p>
          </div>
          {newCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
              {newCount} new
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', ...STATUS_OPTIONS.map((s) => s.value)].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-[#FF385C] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, city, product..."
            className="w-full sm:max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] outline-none text-sm"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No order requests</h3>
              <p className="text-gray-500 text-sm">
                {statusFilter !== 'all' || searchQuery
                  ? 'Try changing filters or search.'
                  : 'Requests will appear here when customers use "Buy now" on a product.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const statusMeta = STATUS_OPTIONS.find((s) => s.value === req.status) || {
                label: req.status,
                color: 'gray'
              }
              const productImage =
                req.product?.images?.[0] || (typeof req.product?.images === 'string' ? req.product?.images : null)
              const qty = req.quantity || 1
              const lineTotal =
                req.product?.price != null ? (req.product.price * qty) : null

              return (
                <div
                  key={req._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                      {/* Customer & contact */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{req.customerName}</span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'new'
                                ? 'bg-amber-50 text-amber-700'
                                : req.status === 'contacted'
                                ? 'bg-blue-50 text-blue-700'
                                : req.status === 'completed'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          {new Date(req.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <a
                            href={`tel:${req.customerPhone}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF385C] hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            {req.customerPhone}
                          </a>
                          <a
                            href={`https://wa.me/${req.customerPhone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                          </a>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium text-gray-700">{req.city}</span>
                          <br />
                          <span className="text-gray-500">{req.address}</span>
                        </p>
                      </div>

                      {/* Product */}
                      <div className="flex items-start gap-4 lg:min-w-[280px]">
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 overflow-hidden">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={req.product?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{req.product?.name || '—'}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {qty}
                            {lineTotal != null && ` · ${formatCurrency(lineTotal)}`}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req._id, e.target.value)}
                          disabled={updatingId === req._id}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] outline-none disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDelete(req._id)}
                          disabled={deletingId === req._id}
                          className="px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          {deletingId === req._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminRequests
