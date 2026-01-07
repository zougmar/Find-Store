import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatCurrency } from '../utils/currency'

const Profile = () => {
  const { t, isRTL } = useLanguage()
  const { user: authUser, fetchUser } = useAuth()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    image: '',
    imageUrl: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })
  const [uploading, setUploading] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState(new Set())

  useEffect(() => {
    fetchProfile()
    fetchOrders()
  }, [])

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile')
      const imageUrl = res.data.image || ''
      
      setUser({ ...res.data, image: imageUrl })
      setFormData({
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        image: imageUrl,
        imageUrl: imageUrl,
        address: res.data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      })
      console.log('Profile fetched:', { image: imageUrl })
    } catch (error) {
      console.error('Profile fetch error:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders')
      setOrders(res.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await api.post('/users/profile/upload', formData)

      // Use the image URL as-is (Vite proxy will handle /uploads)
      const imageUrl = res.data.imageUrl

      setFormData(prev => ({
        ...prev,
        image: imageUrl,
        imageUrl: imageUrl
      }))
      
      console.log('Image uploaded:', { imageUrl, user: res.data.user })
      
      toast.success('Profile image uploaded successfully!')
      await fetchProfile()
      if (fetchUser) {
        await fetchUser()
        // Force re-render by updating user state
        window.dispatchEvent(new Event('userUpdated'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload image'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleImageUrlChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.value,
      imageUrl: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put('/users/profile', {
        ...formData,
        image: formData.imageUrl
      })
      toast.success('Profile updated successfully!')
      setEditing(false)
      await fetchProfile()
      if (fetchUser) {
        await fetchUser()
        // Force re-render by updating user state
        window.dispatchEvent(new Event('userUpdated'))
      }
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
        <p className="text-gray-600 font-medium">{t('loadingProfile')}</p>
      </div>
    )
  }

  return (
    <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('myProfile')}</h1>
        <p className="text-gray-600 mt-1">{t('manageAccount')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-bold text-gray-900">{t('personalInformation')}</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{t('editProfile')}</span>
              </button>
            )}
          </div>

          {/* Profile Image */}
          <div className="mb-6 text-center">
            {!editing ? (
              <div className="inline-block">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-xl ring-4 ring-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128?text=No+Image'
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto border-4 border-white shadow-xl ring-4 ring-gray-200">
                    <span className="text-white font-bold text-4xl">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-xl ring-4 ring-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/128?text=Invalid+URL'
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto border-4 border-white shadow-xl ring-4 ring-gray-200">
                      <span className="text-white font-bold text-4xl">
                        {formData.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('uploadImageFromComputer') || 'Upload Image from Computer'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#FF385C] file:text-white
                      hover:file:bg-[#E61E4D] file:cursor-pointer
                      disabled:opacity-50"
                  />
                  {uploading && <p className={`text-sm text-[#FF385C] mt-2 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('uploading') || 'Uploading...'}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('orEnterImageUrl') || 'Or Enter Image URL'}</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder={t('placeholderImageUrl') || 'https://example.com/image.jpg'}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('name')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('phone')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('streetAddress') || t('street') || 'Street'}</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('city')}</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('stateProvince') || t('state') || 'State'}</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('zipPostalCode') || t('zipCode') || 'Zip Code'}</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('country')}</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-4`}>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                >
                  {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    fetchProfile()
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              {user?.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-semibold">{user.phone}</p>
                </div>
              )}
              {user?.address && (
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-lg font-semibold">
                    {user.address.street && `${user.address.street}, `}
                    {user.address.city && `${user.address.city}, `}
                    {user.address.state && `${user.address.state} `}
                    {user.address.zipCode && `${user.address.zipCode}`}
                    {user.address.country && `, ${user.address.country}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h2 className="text-xl font-bold text-gray-900">{t('orderHistory')}</h2>
            <p className="text-sm text-gray-600 mt-1">{orders.length} {t('totalOrders')}</p>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium">{t('noOrdersYet')}</p>
              <p className="text-xs mt-1">{t('orderHistoryAppear')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-mono font-bold text-gray-900 text-lg">{t('orderId')} #{order._id.slice(-8)}</p>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.orderStatus === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                        <p className="text-sm text-gray-600 mb-1">{t('totalAmount') || 'Total Amount'}</p>
                        <p className="font-bold text-2xl text-[#FF385C]">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>{order.items?.length || 0} {order.items?.length !== 1 ? t('itemsPlural') : t('items')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="capitalize">{order.paymentMethod || 'card'}</span>
                      </div>
                      {order.paymentDetails?.customerName && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">{order.paymentDetails.customerName}</span>
                        </div>
                      )}
                      {order.paymentDetails?.customerPhone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{order.paymentDetails.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => toggleOrderDetails(order._id)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      {expandedOrders.has(order._id) ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {t('hideDetails') || 'Hide Details'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {t('viewDetails') || 'View Details'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrders.has(order._id) && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 md:p-6 space-y-6">
                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">{t('orderItems') || 'Order Items'}</h3>
                        <div className="space-y-3">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                              {item.product?.images?.[0] && (
                                <img 
                                  src={item.product.images[0]} 
                                  alt={item.product.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/64?text=No+Image'
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                                <p className="text-sm text-gray-600">{t('quantity')}: {item.quantity} × {formatCurrency(item.price)}</p>
                              </div>
                              <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                                <p className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4 text-lg">{t('shippingAddress')}</h3>
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <div className="space-y-1 text-sm text-gray-700">
                              {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
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
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">{t('paymentInformation') || 'Payment Information'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">{t('paymentMethod') || 'Payment Method'}</p>
                            <p className="font-semibold text-gray-900 capitalize">{order.paymentMethod || 'card'}</p>
                          </div>
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">{t('paymentStatus') || 'Payment Status'}</p>
                            <p className={`font-semibold capitalize ${
                              order.paymentStatus === 'paid' ? 'text-green-600' :
                              order.paymentStatus === 'failed' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {order.paymentStatus || 'pending'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information (for Cash on Delivery) */}
                      {order.paymentDetails?.customerName && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-4 text-lg">{t('contactInformation') || 'Contact Information'}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.paymentDetails.customerName && (
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">{t('fullName') || 'Full Name'}</p>
                                <p className="font-semibold text-gray-900">{order.paymentDetails.customerName}</p>
                              </div>
                            )}
                            {order.paymentDetails.customerPhone && (
                              <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">{t('phoneNumber') || 'Phone Number'}</p>
                                <p className="font-semibold text-gray-900">{order.paymentDetails.customerPhone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

