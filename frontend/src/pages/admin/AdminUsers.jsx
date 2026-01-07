import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'moderator',
    permissions: {
      viewDashboard: false,
      manageProducts: false,
      manageOrders: false,
      manageUsers: false,
      managePages: false,
      manageMessages: false,
      manageSettings: false
    }
  })
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      // Also fetch admin and moderator users
      const allUsersRes = await api.get('/admin/users/all')
      setUsers(allUsersRes.data || res.data)
    } catch (error) {
      // Fallback to regular users if all users endpoint doesn't exist
      try {
        const res = await api.get('/admin/users')
        setUsers(res.data)
      } catch (err) {
      toast.error('Failed to fetch users')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const handleViewDetails = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`)
      setSelectedUser(res.data)
    } catch (error) {
      toast.error('Failed to fetch user details')
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setCreating(true)
    try {
      const res = await api.post('/admin/users', formData)
      toast.success('User created successfully!')
      setShowCreateModal(false)
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        phone: '',
        role: 'moderator',
        permissions: {
          viewDashboard: false,
          manageProducts: false,
          manageOrders: false,
          manageUsers: false,
          managePages: false,
          manageMessages: false,
          manageSettings: false
        }
      })
      fetchUsers() // Refresh users list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin user')
    } finally {
      setCreating(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePermissionChange = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    })
  }

  const handleEditPermissions = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role || 'moderator',
      permissions: user.permissions || {
        viewDashboard: false,
        manageProducts: false,
        manageOrders: false,
        manageUsers: false,
        managePages: false,
        manageMessages: false,
        manageSettings: false
      }
    })
    setShowPermissionsModal(true)
  }

  const handleUpdatePermissions = async (e) => {
    e.preventDefault()
    
    if (!editingUser) return

    setUpdating(true)
    try {
      await api.put(`/admin/users/${editingUser._id}`, {
        role: formData.role,
        permissions: formData.permissions
      })
      toast.success('User permissions updated successfully!')
      setShowPermissionsModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update permissions')
    } finally {
      setUpdating(false)
    }
  }

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all registered users and their accounts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#FF385C] text-white font-semibold rounded-lg hover:bg-[#E61E4D] transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create User
          </button>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Users</label>
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
                  placeholder="Search by Name, Email, Phone..."
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

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="moderator">Moderators</option>
                <option value="admin">Admins</option>
                <option value="delivery">Delivery Men</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of <span className="font-semibold text-gray-900">{users.length}</span> users
            </span>
            {(searchQuery || roleFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <p className="text-sm text-gray-600 mt-1">{filteredUsers.length} users</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="text-sm">
                              {users.length === 0 ? 'No users found' : 'No users match your filters'}
                            </p>
                            {users.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-200"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mr-3 border-2 border-gray-200">
                                  <span className="text-white font-semibold text-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role || 'user'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600">{user.phone || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                              {user.totalOrders || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleViewDetails(user._id)}
                              className="text-[#FF385C] hover:text-[#E61E4D] font-semibold transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditPermissions(user)}
                              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                            >
                              {user.role === 'admin' || user.role === 'moderator' ? 'Permissions' : user.role === 'delivery' ? 'Edit Role' : 'Edit Role'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-gray-200 shadow-lg mb-3"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center border-4 border-gray-200 shadow-lg mb-3">
                      <span className="text-white font-bold text-2xl">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{selectedUser.role || 'user'}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Email Address</p>
                    <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Phone Number</p>
                      <p className="font-semibold text-gray-900">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Total Orders</p>
                    <p className="font-bold text-xl text-blue-900">{selectedUser.orders?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">Total Spent</p>
                    <p className="font-bold text-xl text-orange-900">
                      {formatCurrency(selectedUser.orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0)}
                    </p>
                  </div>
                </div>

                {selectedUser.orders && selectedUser.orders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Order History
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedUser.orders.map(order => (
                        <div key={order._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-semibold text-gray-900">Order #{order._id.slice(-8)}</p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {formatCurrency(order.totalAmount)} - {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 font-medium">Select a user to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Admin User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', email: '', password: '', phone: '' })
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                  placeholder="Enter password (min 6 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="delivery">Delivery Man</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'delivery' 
                    ? 'Delivery men can access the delivery portal and view assigned orders'
                    : formData.role === 'moderator'
                    ? 'Moderators can have specific permissions assigned'
                    : 'Role permissions vary by type'}
                </p>
              </div>

              {formData.role === 'moderator' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {Object.keys(formData.permissions).map(permission => (
                      <label key={permission} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions[permission]}
                          onChange={() => handlePermissionChange(permission)}
                          className="w-4 h-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {permission.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ 
                      name: '', 
                      email: '', 
                      password: '', 
                      phone: '',
                      role: 'moderator',
                      permissions: {
                        viewDashboard: false,
                        manageProducts: false,
                        manageOrders: false,
                        manageUsers: false,
                        managePages: false,
                        manageMessages: false,
                        manageSettings: false
                      }
                    })
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#FF385C] text-white font-semibold rounded-lg hover:bg-[#E61E4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions/Role Modal */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser.role === 'admin' || editingUser.role === 'moderator' ? 'Edit Permissions' : 'Edit Role'}
              </h2>
              <button
                onClick={() => {
                  setShowPermissionsModal(false)
                  setEditingUser(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdatePermissions} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="delivery">Delivery Man</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'delivery' 
                    ? 'Delivery men can access the delivery portal and view assigned orders'
                    : formData.role === 'moderator'
                    ? 'Moderators can have specific permissions assigned'
                    : 'Role permissions vary by type'}
                </p>
              </div>

              {formData.role === 'moderator' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {Object.keys(formData.permissions).map(permission => (
                      <label key={permission} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions[permission]}
                          onChange={() => handlePermissionChange(permission)}
                          className="w-4 h-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {permission.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-[#FF385C] text-white font-semibold rounded-lg hover:bg-[#E61E4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminUsers

