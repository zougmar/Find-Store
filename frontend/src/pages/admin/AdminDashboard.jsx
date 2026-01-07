import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/currency'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import toast from 'react-hot-toast'

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard')
      console.log('Dashboard data received:', res.data)
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-xl shadow-lg p-8">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 text-center">Unable to load dashboard statistics. Please try again later.</p>
        </div>
      </AdminLayout>
    )
  }

  const orderStatusData = stats.ordersByStatus?.map(item => ({
    name: item._id ? (item._id.charAt(0).toUpperCase() + item._id.slice(1)) : 'Unknown',
    value: item.count || 0,
    status: item._id ? item._id.toLowerCase() : 'unknown'
  })) || []

  // Color mapping for order statuses
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase()
    if (statusLower === 'delivered') return '#10b981' // green
    if (statusLower === 'pending') return '#f59e0b' // yellow/amber
    if (statusLower === 'processing') return '#3b82f6' // blue
    if (statusLower === 'shipped') return '#8b5cf6' // purple
    if (statusLower === 'cancelled') return '#ef4444' // red
    return '#6b7280' // gray for unknown
  }

  // Prepare sales over time data for Recharts
  // Backend already formats the data with month, orders, and revenue
  const salesOverTimeData = stats.salesOverTime || []
  
  // If no data, create empty array with last 12 months for better visualization
  const generateEmptyMonths = () => {
    const months = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentDate = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      months.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`,
        orders: 0,
        revenue: 0
      })
    }
    return months
  }
  
  // Use actual data if available, otherwise show empty months
  const chartData = salesOverTimeData.length > 0 ? salesOverTimeData : generateEmptyMonths()
  
  // Ensure data is sorted by month
  const sortedChartData = [...chartData].sort((a, b) => {
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const aMonth = a.month.split(' ')[0]
    const bMonth = b.month.split(' ')[0]
    const aYear = parseInt(a.month.split(' ')[1])
    const bYear = parseInt(b.month.split(' ')[1])
    
    if (aYear !== bYear) return aYear - bYear
    return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth)
  })

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl shadow-lg p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard Overview</h1>
              <p className="text-white/90 text-base md:text-lg">{currentDate}</p>
              <p className="text-white/80 mt-2 text-sm md:text-base">Welcome back! Here's what's happening with your store today.</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
              <Link
                to="/admin/messages"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm md:text-base border border-white/20"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                View Messages
                {stats.unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                    {stats.unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                to="/admin/orders"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm md:text-base border border-white/20"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Total Users Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-gray-200 hover:shadow-md transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-40 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">Users</span>
              </div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Users</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Registered customers
              </p>
            </div>
          </div>

          {/* Total Messages Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            {stats.unreadMessages > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center animate-pulse shadow-lg z-10">
                {stats.unreadMessages > 9 ? '9+' : stats.unreadMessages}
              </div>
            )}
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">Messages</span>
              </div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Messages</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalMessages || 0}</p>
              <p className="text-xs text-gray-500">
                {stats.unreadMessages > 0 ? (
                  <span className="font-semibold text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {stats.unreadMessages} unread
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    All messages read
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Total Products Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">Products</span>
              </div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Products</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalProducts}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Available items
              </p>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">Orders</span>
              </div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Orders</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                All-time orders
              </p>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-5 md:p-6 text-white hover:shadow-lg transition-all duration-200 relative overflow-hidden group border border-blue-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">Revenue</span>
              </div>
              <h3 className="text-white/90 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</h3>
              <p className="text-4xl font-bold text-white mb-1">{formatCurrency(stats.totalRevenue || 0)}</p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Total earnings
              </p>
            </div>
          </div>
        </div>

        {/* Sales Over Time Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sales Trend</h2>
              <p className="text-sm text-gray-600">Last 12 months performance overview</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs font-semibold text-gray-700">Orders</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-xs font-semibold text-gray-700">Revenue</span>
              </div>
            </div>
          </div>
          {sortedChartData && sortedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={sortedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 50 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af"
                style={{ fontSize: '12px', fontWeight: '500', fontFamily: 'system-ui' }}
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fill: '#6b7280' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#3b82f6"
                style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'system-ui' }}
                tick={{ fill: '#3b82f6' }}
                tickLine={{ stroke: '#93c5fd' }}
                width={60}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'system-ui' }}
                tick={{ fill: '#10b981' }}
                tickLine={{ stroke: '#86efac' }}
                width={80}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '10px 12px',
                  fontSize: '13px'
                }}
                labelStyle={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [formatCurrency(value), 'Revenue'];
                  }
                  return [value, 'Orders'];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                iconType="line"
                iconSize={14}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
                name="Orders"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#10b981' }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium">No sales data available</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Selling Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Best Selling Products</h2>
                <p className="text-xs text-gray-500 mt-0.5">Top performing items</p>
              </div>
            </div>
            {stats.bestSellingProducts && stats.bestSellingProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.bestSellingProducts} margin={{ top: 15, right: 20, left: 0, bottom: 60 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="_id.name" 
                    stroke="#9ca3af"
                    style={{ fontSize: '11px', fontWeight: '500', fontFamily: 'system-ui' }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px', fontWeight: '600', fontFamily: 'system-ui' }} 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      padding: '10px 12px',
                      fontSize: '13px'
                    }}
                    labelStyle={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}
                  />
                  <Bar dataKey="totalSold" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No sales data available</p>
              </div>
            )}
        </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Orders by Status</h2>
                <p className="text-xs text-gray-500 mt-0.5">Order distribution overview</p>
              </div>
            </div>
            {orderStatusData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} stroke="#fff" strokeWidth={2.5} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '10px 12px',
                        fontSize: '13px'
                      }}
                      labelStyle={{ fontWeight: '600', marginBottom: '4px', color: '#374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {orderStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getStatusColor(entry.status) }}></div>
                      <span className="text-sm text-gray-700 font-medium">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[320px] text-gray-400">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">No order data available</p>
              </div>
            )}
        </div>
      </div>

        {/* Most Favorited Products */}
        {stats.mostFavoritedProducts && stats.mostFavoritedProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Most Favorited Products</h2>
                <p className="text-sm text-gray-500 mt-1">Customer favorites</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Favorites
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.mostFavoritedProducts.map((item, index) => (
                    <tr key={item._id?._id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item._id?.images && item._id.images.length > 0 ? (
                            <img
                              src={item._id.images[0]}
                              alt={item._id.name}
                              className="h-14 w-14 rounded-xl object-cover mr-4 border-2 border-gray-200 shadow-md"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 mr-4 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-xs text-gray-500 font-medium">No img</span>
                            </div>
                          )}
                          <span className="text-sm font-bold text-gray-900">
                            {item._id?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-4 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                          {item._id?.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(item._id?.price || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-[#FF385C] mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm font-bold text-gray-900">
                            {item.favoriteCount || 0} <span className="text-gray-500 font-normal">users</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500 mt-1">Latest transactions</p>
              </div>
            </div>
            <Link
              to="/admin/orders"
              className="text-[#FF385C] hover:text-[#E61E4D] font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {stats.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentOrders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-gray-900">
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
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Copy ID
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {order.user?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-4 py-2 inline-flex text-xs leading-5 font-bold rounded-lg border-2 ${
                          order.orderStatus === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.orderStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          order.orderStatus === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium">No recent orders</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard

