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
  // Debug logging for production
  if (!req.user) {
    console.error('Delivery route access denied: No user found in request');
    return res.status(403).json({ 
      message: 'Access denied. Delivery man only. Please log in again.',
      debug: 'No user found'
    });
  }
  
  if (req.user.role !== 'delivery') {
    console.error(`Delivery route access denied: User role is '${req.user.role}', expected 'delivery'`, {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role
    });
    return res.status(403).json({ 
      message: 'Access denied. Delivery man only.',
      debug: `User role is '${req.user.role}', expected 'delivery'`
    });
  }
  
  next();
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

    // Find user by email or phone (check all roles first)
    let user;
    if (email) {
      user = await User.findOne({ 
        email: email.toLowerCase().trim()
      });
    } else if (phone) {
      user = await User.findOne({ 
        phone: phone.trim()
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Check password first (before role check)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Wrong password.' });
    }

    // Now check if user has delivery role (only if password is correct)
    if (user.role !== 'delivery') {
      console.error('Delivery login attempt with wrong role (password correct):', {
        userId: user._id,
        email: user.email,
        phone: user.phone,
        currentRole: user.role,
        expectedRole: 'delivery'
      });
      return res.status(403).json({ 
        message: `✅ Password correct! But your account role is '${user.role || 'user'}'. You need 'delivery' role to access delivery portal. Please contact admin to update your role.`,
        currentRole: user.role || 'user',
        userId: user._id.toString(),
        email: user.email,
        phone: user.phone
      });
    }

    // Log successful login for debugging
    console.log('Delivery man login successful:', {
      userId: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role
    });

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
    
    // Try to find by full ID first
    let order = await Order.findById(orderId)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone');

    // If not found by full ID, try searching by tracking number (last 12 chars)
    if (!order) {
      const allOrders = await Order.find()
        .populate('user', 'name email phone image address')
        .populate('items.product', 'name images price')
        .populate('assignedDeliveryMan', 'name email phone');
      
      // First, try to find order with matching tracking number that's assigned to this delivery man
      order = allOrders.find(o => {
        const trackingMatch = o._id.toString().slice(-12).toUpperCase() === orderId.toUpperCase();
        const isAssigned = o.assignedDeliveryMan?.toString() === req.user._id.toString();
        return trackingMatch && isAssigned;
      });

      // If still not found, try finding by tracking number even if not assigned (for scanning convenience)
      // This allows delivery men to scan any order, but we'll indicate it's not assigned
      if (!order) {
        order = allOrders.find(o => 
          o._id.toString().slice(-12).toUpperCase() === orderId.toUpperCase()
        );
        
        // If found but not assigned, still return it but indicate it needs assignment
        if (order && (!order.assignedDeliveryMan || order.assignedDeliveryMan.toString() !== req.user._id.toString())) {
          // Return the order but flag it as not assigned
          return res.json({
            ...order.toObject(),
            _assignmentWarning: 'This order is not assigned to you. Contact admin to assign it.'
          });
        }
      }
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check the order ID.' });
    }

    // If order exists and is assigned to this delivery man, return it normally
    // (The check above already handled the unassigned case)
    if (order.assignedDeliveryMan?.toString() === req.user._id.toString()) {
      return res.json(order);
    }

    // This shouldn't happen, but just in case
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

    // Auto-assign order if not assigned, or verify assignment
    if (!order.assignedDeliveryMan) {
      // Auto-assign the order to this delivery man if not assigned
      order.assignedDeliveryMan = req.user._id;
    } else if (order.assignedDeliveryMan.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This order is assigned to another delivery person. Please contact admin.' });
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
