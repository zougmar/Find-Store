const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

function attachRealtime(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    path: '/socket.io',
    cors: { origin: true, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('role permissions');
      if (!user || !['admin', 'moderator', 'delivery'].includes(user.role)) {
        return next(new Error('forbidden'));
      }
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user.role === 'admin') {
      socket.join('admins');
      return;
    }
    if (user.role === 'moderator' && (user.permissions?.manageOrders || user.permissions?.manageProductInquiries || user.permissions?.manageUsers)) {
      socket.join('staff');
      return;
    }
    if (user.role === 'delivery') {
      socket.join(`delivery:${user._id}`);
    }
  });

  return io;
}

function emit(room, event, payload) {
  if (!io) return;
  io.to(room).emit(event, payload);
}

function emitSync(scope, extra = {}) {
  const payload = {
    scope,
    action: extra.action || 'change',
    id: extra.id ? String(extra.id) : null,
    at: Date.now()
  };
  emit('admins', 'sync', payload);
  if (scope === 'orders') {
    emit('staff', 'sync', payload);
    if (extra.deliveryUserId) {
      emit(`delivery:${extra.deliveryUserId}`, 'sync', payload);
    }
  }
}

module.exports = { attachRealtime, emit, emitSync };
