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

// Middleware to check if user is a moderator
const isModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  
  if (req.user.role === 'admin') {
    // Admins have full access
    return next();
  }
  
  if (req.user.role === 'moderator') {
    // Check if moderator has manageOrders permission
    if (req.user.permissions && req.user.permissions.manageOrders) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Moderator with manageOrders permission required.' });
  }
  
  return res.status(403).json({ message: 'Access denied. Moderator or admin only.' });
};

// @route   POST /api/moderator/login
// @desc    Login moderator
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    // Find user by email with moderator or admin role
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      role: { $in: ['moderator', 'admin'] }
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials. No user found with this email and moderator/admin role.' 
      });
    }

    // Check password first (before role/permission checks)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Wrong password.' });
    }

    // For moderators, check if they have manageOrders permission
    // Allow access if permissions object doesn't exist (legacy) or if manageOrders is true
    if (user.role === 'moderator') {
      if (user.permissions === undefined || user.permissions === null) {
        // If permissions don't exist, allow access (legacy behavior)
        // But log a warning
        console.warn(`Moderator ${user.email} logged in without permissions object. Consider setting permissions.`);
      } else if (user.permissions && !user.permissions.manageOrders) {
        return res.status(403).json({ 
          message: '✅ Password correct! But your account does not have "Manage Orders" permission. Please contact admin to enable this permission.',
          currentPermissions: user.permissions || {},
          requiredPermission: 'manageOrders',
          userId: user._id.toString(),
          email: user.email
        });
      }
    }

    console.log('Moderator login successful:', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions || {},
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/moderator/orders
// @desc    Get all orders (moderator can view all orders)
// @access  Private (Moderator)
router.get('/orders', protect, isModerator, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/moderator/orders/:id
// @desc    Get order details
// @access  Private (Moderator)
router.get('/orders/:id', protect, isModerator, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Helper function to record changes
const recordChange = (order, user, action, changes = {}, notes = '') => {
  if (!order.changeHistory) {
    order.changeHistory = [];
  }
  order.changeHistory.push({
    changedBy: user._id,
    changedAt: new Date(),
    action,
    changes,
    notes
  });
};

// @route   PUT /api/moderator/orders/:id/verify
// @desc    Verify and confirm order
// @access  Private (Moderator)
router.put('/orders/:id/verify', protect, isModerator, [
  body('orderStatus').isIn(['confirmed', 'cancelled']).withMessage('Invalid status for verification')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { orderStatus, internalNotes } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    const oldNotes = order.internalNotes;

    // Update order
    order.verified = orderStatus === 'confirmed';
    order.verifiedBy = req.user._id;
    order.verifiedAt = new Date();
    order.orderStatus = orderStatus;
    if (orderStatus === 'confirmed') {
      order.orderStatus = 'confirmed';
    } else if (orderStatus === 'cancelled') {
      order.orderStatus = 'cancelled';
    }
    
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }

    // Record change
    const changes = {
      orderStatus: { from: oldStatus, to: orderStatus },
      verified: { from: order.verified, to: orderStatus === 'confirmed' }
    };
    if (internalNotes !== undefined && internalNotes !== oldNotes) {
      changes.internalNotes = { from: oldNotes, to: internalNotes };
    }
    recordChange(order, req.user, 'verify_order', changes, `Order ${orderStatus} by moderator`);

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role');

    res.json({
      message: orderStatus === 'confirmed' ? 'Order verified and confirmed successfully' : 'Order cancelled',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/moderator/orders/:id/status
// @desc    Update order status (New, Confirmed, Cancelled)
// @access  Private (Moderator)
router.put('/orders/:id/status', protect, isModerator, [
  body('orderStatus').isIn(['new', 'confirmed', 'cancelled']).withMessage('Invalid order status')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { orderStatus, internalNotes } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    const oldNotes = order.internalNotes;

    // Update order status
    order.orderStatus = orderStatus;
    
    // If confirming, mark as verified
    if (orderStatus === 'confirmed') {
      order.verified = true;
      order.verifiedBy = req.user._id;
      order.verifiedAt = new Date();
    }

    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }

    // Record change
    const changes = {
      orderStatus: { from: oldStatus, to: orderStatus }
    };
    if (internalNotes !== undefined && internalNotes !== oldNotes) {
      changes.internalNotes = { from: oldNotes, to: internalNotes };
    }
    recordChange(order, req.user, 'update_status', changes, `Order status changed to ${orderStatus}`);

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role');

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/moderator/orders/:id/assign
// @desc    Assign order to delivery man
// @access  Private (Moderator)
router.put('/orders/:id/assign', protect, isModerator, [
  body('assignedDeliveryMan').notEmpty().withMessage('Delivery man ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { assignedDeliveryMan, internalNotes } = req.body;
    const { id } = req.params;

    // Verify delivery man exists and has delivery role
    const deliveryMan = await User.findById(assignedDeliveryMan);
    if (!deliveryMan || deliveryMan.role !== 'delivery') {
      return res.status(400).json({ message: 'Invalid delivery man. User must have delivery role.' });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldDeliveryMan = order.assignedDeliveryMan;
    const oldNotes = order.internalNotes;

    // Update order
    order.assignedDeliveryMan = assignedDeliveryMan;
    order.deliveryStatus = 'pending';
    
    if (internalNotes !== undefined) {
      order.internalNotes = internalNotes;
    }

    // Record change
    const changes = {
      assignedDeliveryMan: { 
        from: oldDeliveryMan ? oldDeliveryMan.toString() : 'none', 
        to: assignedDeliveryMan.toString() 
      },
      deliveryStatus: { from: order.deliveryStatus, to: 'pending' }
    };
    if (internalNotes !== undefined && internalNotes !== oldNotes) {
      changes.internalNotes = { from: oldNotes, to: internalNotes };
    }
    recordChange(order, req.user, 'assign_delivery', changes, `Order assigned to ${deliveryMan.name}`);

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role');

    res.json({
      message: 'Order assigned to delivery man successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/moderator/orders/:id/notes
// @desc    Add/update internal notes to order
// @access  Private (Moderator)
router.put('/orders/:id/notes', protect, isModerator, [
  body('internalNotes').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { internalNotes } = req.body;
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldNotes = order.internalNotes;

    // Update internal notes
    order.internalNotes = internalNotes || '';

    // Record change
    if (internalNotes !== oldNotes) {
      recordChange(order, req.user, 'update_notes', {
        internalNotes: { from: oldNotes, to: internalNotes || '' }
      }, 'Internal notes updated');
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images price')
      .populate('assignedDeliveryMan', 'name email phone image')
      .populate('verifiedBy', 'name email')
      .populate('changeHistory.changedBy', 'name email role');

    res.json({
      message: 'Internal notes updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/moderator/delivery-men
// @desc    Get all delivery men (for assignment)
// @access  Private (Moderator)
router.get('/delivery-men', protect, isModerator, async (req, res, next) => {
  try {
    const deliveryMen = await User.find({ role: 'delivery' })
      .select('name email phone image')
      .sort({ name: 1 });

    res.json(deliveryMen);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/moderator/me
// @desc    Get current moderator profile
// @access  Private (Moderator)
router.get('/me', protect, isModerator, async (req, res, next) => {
  try {
    // Get moderator stats
    const totalOrders = await Order.countDocuments();
    const newOrders = await Order.countDocuments({ orderStatus: 'new' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed' });
    const pendingOrders = await Order.countDocuments({ 
      orderStatus: { $in: ['confirmed', 'processing', 'shipped'] }
    });

    res.json({
      ...req.user.toObject(),
      stats: {
        totalOrders,
        newOrders,
        confirmedOrders,
        pendingOrders
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

