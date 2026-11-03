const Notification = require('../models/Notification');
const { emit, emitSync } = require('../realtime');
const { sendAdminEmail } = require('./mailer');
const { orderEmail, messageEmail } = require('./emailTemplates');

async function saveNotification(doc) {
  try {
    const created = await Notification.create(doc);
    emit('admins', 'notification', {
      _id: created._id,
      type: created.type,
      title: created.title,
      body: created.body,
      link: created.link,
      read: false,
      createdAt: created.createdAt
    });
    return created;
  } catch (error) {
    if (error.code === 11000) return null;
    console.error('Notification save failed:', error.message);
    return null;
  }
}

function customerName(order) {
  return order.paymentDetails?.customerName || order.user?.name || 'Guest';
}

async function announceNewOrder(order) {
  emitSync('orders', {
    action: 'created',
    id: order._id,
    deliveryUserId: order.assignedDeliveryMan
  });
  const saved = await saveNotification({
    type: 'order_created',
    title: 'New order',
    body: `${customerName(order)} placed an order for ${order.totalAmount} MAD`,
    link: '/admin/orders',
    entityId: String(order._id),
    dedupeKey: `order-created:${order._id}`
  });
  if (!saved) return;
  try {
    await sendAdminEmail(orderEmail(order));
  } catch (error) {
    console.error('Order email failed:', error.message);
  }
}

async function announceNewMessage(message) {
  emitSync('messages', { action: 'created', id: message._id });
  const saved = await saveNotification({
    type: 'message_created',
    title: 'New message',
    body: `${message.name}: ${message.subject}`,
    link: '/admin/messages',
    entityId: String(message._id),
    dedupeKey: `message-created:${message._id}`
  });
  if (!saved) return;
  try {
    await sendAdminEmail(messageEmail(message));
  } catch (error) {
    console.error('Message email failed:', error.message);
  }
}

async function announceOrderStatus(order, actorName) {
  emitSync('orders', {
    action: 'status',
    id: order._id,
    deliveryUserId: order.assignedDeliveryMan?._id || order.assignedDeliveryMan
  });
  await saveNotification({
    type: 'order_status',
    title: 'Order updated',
    body: `${actorName || 'An employee'} set order ${String(order._id).slice(-6)} to ${order.orderStatus || order.deliveryStatus}`,
    link: '/admin/orders',
    entityId: String(order._id),
    dedupeKey: `order-status:${order._id}:${order.orderStatus}:${order.deliveryStatus}:${order.updatedAt?.getTime?.() || Date.now()}`
  });
}

async function announceEmployeeAction(body, entityId) {
  emitSync('users', { action: 'change', id: entityId });
  await saveNotification({
    type: 'employee_action',
    title: 'Team update',
    body,
    link: '/admin/users',
    entityId: entityId ? String(entityId) : '',
    dedupeKey: `employee:${entityId || 'none'}:${Date.now()}`
  });
}

module.exports = {
  emitSync,
  announceNewOrder,
  announceNewMessage,
  announceOrderStatus,
  announceEmployeeAction
};
