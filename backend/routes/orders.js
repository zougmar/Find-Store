const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { triggerAutomation } = require('../services/aiAgentService');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    
    // Calculate total and validate products
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }
    
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || req.user.address,
      paymentMethod: paymentMethod || 'card',
      paymentDetails: req.body.paymentDetails || {},
      contactConsent: req.body.contactConsent || false
    });
    
    await order.populate('items.product', 'name images');
    await order.populate('user', 'name email phone');
    
    // Trigger AI Agent automation if consent is given
    if (order.contactConsent) {
      const customerName = req.body.paymentDetails?.customerName || req.user.name || 'Customer';
      const customerPhone = req.body.paymentDetails?.customerPhone || req.user.phone || '';
      const customerEmail = req.user.email || '';
      
      const automationData = {
        orderId: order._id.toString(),
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        products: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: order.totalAmount,
        shippingAddress: order.shippingAddress
      };
      
      // Trigger automation asynchronously (don't wait for response)
      triggerAutomation(automationData).catch(err => {
        console.error('Automation error (non-blocking):', err.message);
      });
    }
    
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

