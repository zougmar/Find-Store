const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d'
  });
};

// Middleware to check if user is a delivery man
const isDeliveryMan = (req, res, next) => {
  if (req.user && req.user.role === 'delivery') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Delivery man only.' });
  }
};

// @route   POST /api/delivery/login
// @desc    Login delivery man (by email or phone)
// @access  Public
router.post('/login', [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    // Find user by email or phone with delivery role
    let user;
    if (email) {
      user = await User.findOne({ 
        email: email.toLowerCase().trim(),
        role: 'delivery'
      });
    } else if (phone) {
      user = await User.findOne({ 
        phone: phone.trim(),
        role: 'delivery'
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or not authorized as delivery man' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/delivery/orders
// @desc    Get all orders assigned to the delivery man
// @access  Private (Delivery Man)
router.get('/orders', protect, isDeliveryMan, async (req, res, next) => {
  try {
    const orders = await Order.find({ 
      assignedDeliveryMan: req.user._id 
    })
      .populate('user', 'name email phone image')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/delivery/orders/:orderId
// @desc    Get order details by ID or tracking number
// @access  Private (Delivery Man)
router.get('/orders/:orderId', protect, isDeliveryMan, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by ID or by tracking number (last 12 chars of ID)
    let order = await Order.findById(orderId)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone');

    // If not found by ID, try searching by tracking number (assuming orderId might be last 12 chars)
    if (!order) {
      const orders = await Order.find()
        .populate('user', 'name email phone image address')
        .populate('items.product', 'name images price')
        .populate('assignedDeliveryMan', 'name email phone');
      
      order = orders.find(o => 
        o._id.toString().slice(-12).toUpperCase() === orderId.toUpperCase() &&
        o.assignedDeliveryMan?.toString() === req.user._id.toString()
      );
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to you' });
    }

    // Verify the order is assigned to this delivery man
    if (order.assignedDeliveryMan?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This order is not assigned to you' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/delivery/orders/:orderId/status
// @desc    Update delivery status
// @access  Private (Delivery Man)
router.put('/orders/:orderId/status', protect, isDeliveryMan, [
  body('deliveryStatus').isIn(['picked_up', 'on_the_way', 'delivered', 'failed'])
    .withMessage('Invalid delivery status'),
  body('deliveryNotes').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { orderId } = req.params;
    const { deliveryStatus, deliveryNotes } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify the order is assigned to this delivery man
    if (order.assignedDeliveryMan?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This order is not assigned to you' });
    }

    // Update order status
    order.deliveryStatus = deliveryStatus;
    if (deliveryNotes) {
      order.deliveryNotes = deliveryNotes;
    }

    // Update main order status based on delivery status
    if (deliveryStatus === 'delivered') {
      order.orderStatus = 'delivered';
      order.paymentStatus = order.paymentMethod === 'cash' ? 'paid' : order.paymentStatus;
    } else if (deliveryStatus === 'picked_up' || deliveryStatus === 'on_the_way') {
      order.orderStatus = 'shipped';
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone');

    res.json({
      message: 'Delivery status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/delivery/me
// @desc    Get current delivery man profile
// @access  Private (Delivery Man)
router.get('/me', protect, isDeliveryMan, async (req, res, next) => {
  try {
    // Get delivery man stats
    const totalOrders = await Order.countDocuments({ assignedDeliveryMan: req.user._id });
    const deliveredOrders = await Order.countDocuments({ 
      assignedDeliveryMan: req.user._id,
      deliveryStatus: 'delivered'
    });
    const pendingOrders = await Order.countDocuments({ 
      assignedDeliveryMan: req.user._id,
      deliveryStatus: { $in: ['pending', 'picked_up', 'on_the_way'] }
    });

    res.json({
      ...req.user.toObject(),
      stats: {
        totalOrders,
        deliveredOrders,
        pendingOrders
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
