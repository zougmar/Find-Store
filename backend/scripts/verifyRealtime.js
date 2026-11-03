require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io } = require('../../frontend/node_modules/socket.io-client');
const axios = require('axios');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

async function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io('http://localhost:5000', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket']
    });
    const timer = setTimeout(() => reject(new Error('connect timeout')), 8000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = await User.findOne({ role: 'admin' }).select('_id role');
  if (!admin) throw new Error('No admin user found');
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', { expiresIn: '5m' });

  let rejected = false;
  try {
    await connect('not-a-token');
  } catch (error) {
    rejected = true;
  }
  if (!rejected) throw new Error('Unauthenticated socket was accepted');

  const first = await connect(token);
  const second = await connect(token);
  let syncs = 0;
  let notes = 0;
  const wait = new Promise((resolve) => {
    const done = () => {
      if (syncs >= 2 && notes >= 2) resolve();
    };
    first.on('sync', () => { syncs += 1; done(); });
    second.on('sync', () => { syncs += 1; done(); });
    first.on('notification', () => { notes += 1; done(); });
    second.on('notification', () => { notes += 1; done(); });
  });

  const created = await axios.post('http://localhost:5000/api/messages', {
    name: 'Realtime Check',
    email: 'realtime-check@example.com',
    subject: 'socket test',
    message: 'verification only'
  });
  await Promise.race([
    wait,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`missing events syncs=${syncs} notes=${notes}`)), 8000))
  ]);
  await Message.deleteOne({ _id: created.data.data._id });
  await Notification.deleteMany({ entityId: String(created.data.data._id) });
  first.disconnect();
  second.disconnect();
  console.log(`verifyRealtime: ok syncs=${syncs} notes=${notes}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('verifyRealtime failed:', error.message);
  try { await Message.deleteMany({ email: 'realtime-check@example.com' }); } catch (cleanupError) {}
  process.exit(1);
});
