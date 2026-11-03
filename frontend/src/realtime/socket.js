import { io } from 'socket.io-client'
import { notifyAdminChange } from '../utils/adminSync'

let socket = null
let activeToken = null
let connected = false

export function isRealtimeConnected() {
  return connected
}

export function connectRealtime(token) {
  if (!token) return null
  if (socket && activeToken === token) return socket

  disconnectRealtime()
  activeToken = token
  socket = io(window.location.origin, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity
  })

  socket.on('connect', () => {
    connected = true
    notifyAdminChange('all')
  })
  socket.on('disconnect', () => {
    connected = false
  })
  socket.on('sync', (payload) => {
    notifyAdminChange(payload?.scope || 'all')
  })
  socket.on('notification', (payload) => {
    window.dispatchEvent(new CustomEvent('findstore-notification', { detail: payload }))
  })

  return socket
}

export function disconnectRealtime() {
  connected = false
  activeToken = null
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
