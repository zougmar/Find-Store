const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['order_created', 'message_created', 'order_status', 'employee_action'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  link: { type: String, default: '/admin' },
  read: { type: Boolean, default: false },
  entityId: { type: String, default: '' },
  dedupeKey: { type: String }
}, { timestamps: true });

notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
