import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AdminMessages = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, read, unread
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [filter])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = filter === 'all' ? {} : { read: filter === 'read' }
      const res = await api.get('/admin/messages', { params })
      setMessages(res.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/admin/messages/${messageId}/read`)
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ))
      if (selectedMessage?._id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: true })
      }
      toast.success('Message marked as read')
    } catch (error) {
      console.error('Error marking message as read:', error)
      toast.error('Failed to mark message as read')
    }
  }

  const handleMarkAsUnread = async (messageId) => {
    try {
      await api.put(`/admin/messages/${messageId}/unread`)
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: false } : msg
      ))
      if (selectedMessage?._id === messageId) {
        setSelectedMessage({ ...selectedMessage, read: false })
      }
      toast.success('Message marked as unread')
    } catch (error) {
      console.error('Error marking message as unread:', error)
      toast.error('Failed to mark message as unread')
    }
  }

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      await api.delete(`/admin/messages/${messageId}`)
      setMessages(messages.filter(msg => msg._id !== messageId))
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null)
      }
      toast.success('Message deleted successfully')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleViewMessage = async (message) => {
    setSelectedMessage(message)
    if (!message.read) {
      await handleMarkAsRead(message._id)
    }
  }

  const unreadCount = messages.filter(msg => !msg.read).length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Manage customer contact messages</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold animate-pulse">
              {unreadCount} Unread
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Filter Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-[#FF385C] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All ({messages.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-[#FF385C] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    filter === 'read'
                      ? 'bg-[#FF385C] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Read ({messages.length - unreadCount})
                </button>
              </div>

              {/* Messages List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>No messages found</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      onClick={() => handleViewMessage(message)}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMessage?._id === message._id ? 'bg-blue-50 border-l-4 border-l-[#FF385C]' : ''
                      } ${!message.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${!message.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {message.name}
                          </h3>
                          <p className="text-xs text-gray-500">{message.email}</p>
                        </div>
                        {!message.read && (
                          <div className="w-2 h-2 bg-[#FF385C] rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium mb-1 line-clamp-1">
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{selectedMessage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${selectedMessage.email}`} className="text-[#FF385C] hover:underline">
                          {selectedMessage.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMessage.read ? (
                      <button
                        onClick={() => handleMarkAsUnread(selectedMessage._id)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Mark Unread
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(selectedMessage._id)}
                        className="px-3 py-1.5 text-sm bg-[#FF385C] text-white rounded-lg hover:bg-[#E61E4D] transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedMessage._id)}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-lg">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminMessages

