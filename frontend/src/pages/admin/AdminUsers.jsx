import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'
import useAutoRefresh from '../../hooks/useAutoRefresh'
import { notifyAdminChange } from '../../utils/adminSync'
import { useAdminI18n } from '../../context/AdminLanguageContext'

const emptyPermissions = {
  viewDashboard: false,
  manageProducts: false,
  manageOrders: false,
  manageProductInquiries: false,
  manageUsers: false,
  managePages: false,
  manageMessages: false,
  manageSettings: false
}

const AdminUsers = () => {
  const location = useLocation()
  const { user: currentUser } = useAuth()
  const { t, language } = useAdminI18n()
  const dateLocale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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
    permissions: { ...emptyPermissions }
  })
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const fetchUsers = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    try {
      const res = await api.get('/admin/users/all')
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      if (!silent) toast.error(t('users.fetchFailed'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    setLoading(true)
    fetchUsers()
  }, [location.pathname, fetchUsers])

  useAutoRefresh(() => fetchUsers({ silent: true }), { scopes: ['users', 'all'] })

  const handleDeleteUser = async (userId) => {
    const previous = users
    setUsers((current) => current.filter((user) => user._id !== userId))
    if (selectedUser?._id === userId) setSelectedUser(null)

    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success(t('users.deleted'))
      setPendingDelete(null)
      notifyAdminChange('users')
    } catch (error) {
      setUsers(previous)
      toast.error(error.response?.data?.message || t('users.deleteFailed'))
    }
  }

  const handleToggleActive = async (account) => {
    if (String(currentUser?._id) === String(account._id)) return
    const nextActive = account.active === false
    const previous = users
    const previousSelected = selectedUser
    setUsers((current) => current.map((item) => (
      item._id === account._id ? { ...item, active: nextActive } : item
    )))
    if (selectedUser?._id === account._id) {
      setSelectedUser((current) => ({ ...current, active: nextActive }))
    }
    try {
      const res = await api.put(`/admin/users/${account._id}`, { active: nextActive })
      setUsers((current) => current.map((item) => (
        item._id === res.data._id ? { ...item, ...res.data } : item
      )))
      toast.success(t('users.updated'))
      notifyAdminChange('users')
    } catch (error) {
      setUsers(previous)
      setSelectedUser(previousSelected)
      toast.error(error.response?.data?.message || t('users.updateFailed'))
    }
  }

  const handleViewDetails = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`)
      setSelectedUser(res.data)
    } catch (error) {
      toast.error(t('users.fetchFailed'))
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error(t('users.createFailed'))
      return
    }

    if (formData.password.length < 6) {
      toast.error(t('users.passwordHint'))
      return
    }

    setCreating(true)
    try {
      const res = await api.post('/admin/users', formData)
      const created = {
        ...res.data,
        totalOrders: 0,
        totalSpent: 0,
        orderHistory: []
      }
      setUsers((current) => [created, ...current.filter((user) => user._id !== created._id)])
      toast.success(t('users.created'))
      setShowCreateModal(false)
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        phone: '',
        role: 'moderator',
        permissions: { ...emptyPermissions }
      })
      notifyAdminChange('users')
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.createFailed'))
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
        manageProductInquiries: false,
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
      const res = await api.put(`/admin/users/${editingUser._id}`, {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        permissions: formData.permissions
      })
      setUsers((current) => current.map((user) => (
        user._id === res.data._id ? { ...user, ...res.data } : user
      )))
      if (selectedUser?._id === res.data._id) {
        setSelectedUser((current) => ({ ...current, ...res.data }))
      }
      toast.success(t('users.updated'))
      setShowPermissionsModal(false)
      setEditingUser(null)
      notifyAdminChange('users')
    } catch (error) {
      toast.error(error.response?.data?.message || t('users.updateFailed'))
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

  const roleLabel = (role) => {
    if (role === 'admin') return t('users.roleAdmin')
    if (role === 'moderator') return t('users.roleModerator')
    if (role === 'delivery') return t('users.roleDelivery')
    return t('users.roleUser')
  }

  const formatDate = (value) => (
    value
      ? new Date(value).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })
      : '—'
  )

  const enabledPermissions = (account) => (
    Object.entries(account.permissions || {}).filter(([, enabled]) => enabled).map(([key]) => key)
  )

  const isSelf = (account) => String(currentUser?._id) === String(account._id)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">{t('users.loading')}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('users.title')}</h1>
          <p className="mt-1 text-gray-600">
            {users.length} · {t('users.subtitle')}
            {refreshing ? ` · ${t('users.updating')}` : ''}
          </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF385C] px-5 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-[#E61E4D] hover:shadow-xl sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('users.create')}
          </button>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('users.search')}</label>
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
                  placeholder={t('users.searchPlaceholder')}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('users.role')}</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">{t('users.allRoles')}</option>
                <option value="user">{t('users.users')}</option>
                <option value="moderator">{t('users.moderators')}</option>
                <option value="admin">{t('users.admins')}</option>
                <option value="delivery">{t('users.deliveryMen')}</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
              <span> / </span>
              <span className="font-semibold text-gray-900">{users.length}</span>
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
                {t('users.clearFilters')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('users.title')}</h2>
                <p className="text-sm text-gray-600 mt-1">{filteredUsers.length} users</p>
              </div>
              <div className="divide-y divide-gray-100 lg:hidden">
                {filteredUsers.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-gray-500">
                    {users.length === 0 ? t('users.empty') : t('users.emptyHint')}
                  </p>
                ) : filteredUsers.map((user) => {
                  const permissions = enabledPermissions(user)
                  const active = user.active !== false
                  return (
                    <article key={user._id} className="p-4">
                      <div className="flex items-start gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
                            {(user.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-gray-900">{user.name}</p>
                          <p className="truncate text-sm text-gray-500" dir="ltr">{user.email}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{roleLabel(user.role)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                              {active ? t('users.active') : t('users.inactive')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                          className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700"
                          aria-expanded={openMenuId === user._id}
                        >
                          {t('users.actions')}
                        </button>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <dt className="text-gray-400">{t('users.phone')}</dt>
                          <dd className="break-all font-medium text-gray-800" dir="ltr">{user.phone || t('users.noPhone')}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">{t('users.orders')}</dt>
                          <dd className="font-medium text-gray-800">{user.totalOrders || 0}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">{t('users.createdAt')}</dt>
                          <dd className="font-medium text-gray-800">{formatDate(user.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">{t('users.permissions')}</dt>
                          <dd className="break-words font-medium text-gray-800">{permissions.length ? permissions.map((key) => t(`perm.${key}`)).join(' · ') : '—'}</dd>
                        </div>
                      </dl>
                      {openMenuId === user._id && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => { setOpenMenuId(null); handleViewDetails(user._id) }} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white">{t('users.view')}</button>
                          <button type="button" onClick={() => { setOpenMenuId(null); handleEditPermissions(user) }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800">{t('users.editRole')}</button>
                          {!isSelf(user) && (
                            <button type="button" onClick={() => { setOpenMenuId(null); handleToggleActive(user) }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800">{active ? t('users.deactivate') : t('users.activate')}</button>
                          )}
                          {!isSelf(user) && (
                            <button type="button" onClick={() => { setOpenMenuId(null); setPendingDelete(user) }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">{t('users.delete')}</button>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[t('users.user'), t('users.email'), t('users.role'), t('users.status'), t('users.permissions'), t('users.createdAt'), t('users.actions')].map((label) => (
                        <th key={label} className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-sm text-gray-500">
                          {users.length === 0 ? t('users.empty') : t('users.emptyHint')}
                        </td>
                      </tr>
                    ) : filteredUsers.map((user) => {
                      const permissions = enabledPermissions(user)
                      const active = user.active !== false
                      return (
                        <tr key={user._id} className="align-top hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <img src={user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
                                  {(user.name || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500" dir="ltr">{user.phone || t('users.noPhone')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{roleLabel(user.role)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                              {active ? t('users.active') : t('users.inactive')}
                            </span>
                          </td>
                          <td className="max-w-[14rem] px-4 py-3 text-xs text-gray-600">
                            {permissions.length ? permissions.map((key) => t(`perm.${key}`)).join(' · ') : '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => handleViewDetails(user._id)} className="text-sm font-semibold text-gray-900 hover:underline">{t('users.view')}</button>
                              <button type="button" onClick={() => handleEditPermissions(user)} className="text-sm font-semibold text-blue-700 hover:underline">{t('users.editRole')}</button>
                              {!isSelf(user) && (
                                <button type="button" onClick={() => handleToggleActive(user)} className="text-sm font-semibold text-gray-700 hover:underline">
                                  {active ? t('users.deactivate') : t('users.activate')}
                                </button>
                              )}
                              {!isSelf(user) && (
                                <button type="button" onClick={() => setPendingDelete(user)} className="text-sm font-semibold text-red-600 hover:underline">{t('users.delete')}</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className={selectedUser ? 'fixed inset-0 z-40 overflow-y-auto bg-black/50 p-3 lg:static lg:col-span-1 lg:overflow-visible lg:bg-transparent lg:p-0' : 'hidden lg:block lg:col-span-1'}>
            {selectedUser ? (
              <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-lg lg:sticky lg:top-6 lg:max-h-none">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{t('users.details')}</h2>
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
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{roleLabel(selectedUser.role)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUser.active === false ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                      {selectedUser.active === false ? t('users.inactive') : t('users.active')}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">{t('users.emailAddress')}</p>
                    <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">{t('users.phoneNumber')}</p>
                      <p className="font-semibold text-gray-900">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">{t('users.totalOrders')}</p>
                    <p className="font-bold text-xl text-blue-900">{selectedUser.orders?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 mb-1">{t('users.totalSpent')}</p>
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
                      {t('users.orderHistory')}
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
                            {formatCurrency(order.totalAmount)} - {formatDate(order.createdAt)}
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
                <p className="text-gray-500 font-medium">{t('users.selectUser')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Admin User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{t('users.createTitle')}</h2>
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
                  {t('users.fullName')} <span className="text-red-500">*</span>
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
                  {t('users.emailAddress')} <span className="text-red-500">*</span>
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
                  {t('users.password')} <span className="text-red-500">*</span>
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
                <p className="text-xs text-gray-500 mt-1">{t('users.passwordHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('users.phoneNumber')} <span className="text-gray-400">({t('users.optional')})</span>
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
                  {t('users.role')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                >
                  <option value="user">{t('users.roleUser')}</option>
                  <option value="moderator">{t('users.roleModerator')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                  <option value="delivery">{t('users.roleDelivery')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'delivery'
                    ? t('users.roleHintDelivery')
                    : formData.role === 'moderator'
                    ? t('users.roleHintModerator')
                    : t('users.roleHintDefault')}
                </p>
              </div>

              {formData.role === 'moderator' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('users.permissions')}
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
                        <span className="text-sm text-gray-700">
                          {t(`perm.${permission}`)}
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
                        manageProductInquiries: false,
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
                  {t('users.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#FF385C] text-white font-semibold rounded-lg hover:bg-[#E61E4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t('users.creating')}
                    </>
                  ) : (
                    t('users.create')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions/Role Modal */}
      {showPermissionsModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('users.editRole')}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('users.fullName')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('users.phoneNumber')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('users.role')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                >
                  <option value="user">{t('users.roleUser')}</option>
                  <option value="moderator">{t('users.roleModerator')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                  <option value="delivery">{t('users.roleDelivery')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'delivery'
                    ? t('users.roleHintDelivery')
                    : formData.role === 'moderator'
                    ? t('users.roleHintModerator')
                    : t('users.roleHintDefault')}
                </p>
              </div>

              {formData.role === 'moderator' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('users.permissions')}
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
                        <span className="text-sm text-gray-700">
                          {t(`perm.${permission}`)}
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
                  {t('users.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-[#FF385C] text-white font-semibold rounded-lg hover:bg-[#E61E4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t('users.saving')}
                    </>
                  ) : (
                    t('users.save')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true">
            <h2 className="text-lg font-bold text-gray-900">{t('users.confirmDeleteTitle')}</h2>
            <p className="mt-2 break-all text-sm text-gray-700">{pendingDelete.name}</p>
            <p className="break-all text-sm text-gray-500" dir="ltr">{pendingDelete.email}</p>
            <p className="mt-3 text-sm text-gray-600">{t('users.confirmDelete')}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 font-semibold text-gray-700"
              >
                {t('users.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(pendingDelete._id)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white"
              >
                {t('users.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminUsers

