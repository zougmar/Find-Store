const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Favorite = require('../models/Favorite');
const Page = require('../models/Page');
const Message = require('../models/Message');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin access
router.use(protect, admin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'page-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalMessages = await Message.countDocuments();
    const unreadMessages = await Message.countDocuments({ read: false });
    
    // Calculate total revenue
    const orders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Best selling products
    const productSales = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);
    
    const bestSellingProducts = await Product.populate(productSales, {
      path: '_id',
      select: 'name images price'
    });
    
    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Most favorited products
    const favoriteCounts = await Favorite.aggregate([
      {
        $group: {
          _id: '$product',
          favoriteCount: { $sum: 1 }
        }
      },
      { $sort: { favoriteCount: -1 } },
      { $limit: 10 }
    ]);
    
    const mostFavoritedProducts = await Product.populate(favoriteCounts, {
      path: '_id',
      select: 'name images price category'
    });
    
    // Sales over time (last 12 months)
    const salesOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format sales over time data
    const formattedSalesOverTime = salesOverTime.map(item => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        orders: item.orders,
        revenue: item.revenue
      };
    });
    
    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      totalMessages,
      unreadMessages,
      bestSellingProducts,
      recentOrders,
      ordersByStatus,
      mostFavoritedProducts,
      salesOverTime: formattedSalesOverTime
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/favorites
// @desc    Get all products with favorite counts
// @access  Private/Admin
router.get('/favorites', async (req, res, next) => {
  try {
    const favoriteStats = await Favorite.aggregate([
      {
        $group: {
          _id: '$product',
          favoriteCount: { $sum: 1 },
          users: { $push: '$user' }
        }
      },
      { $sort: { favoriteCount: -1 } }
    ]);
    
    const productsWithFavorites = await Product.populate(favoriteStats, {
      path: '_id',
      select: 'name images price category stock'
    });
    
    // Get all products and add favorite count (0 if not in favorites)
    const allProducts = await Product.find().select('name images price category stock');
    const productsMap = new Map();
    
    productsWithFavorites.forEach(item => {
      if (item._id) {
        productsMap.set(item._id._id.toString(), {
          product: item._id,
          favoriteCount: item.favoriteCount,
          users: item.users
        });
      }
    });
    
    const result = allProducts.map(product => {
      const favoriteData = productsMap.get(product._id.toString());
      return {
        product,
        favoriteCount: favoriteData ? favoriteData.favoriteCount : 0,
        users: favoriteData ? favoriteData.users : []
      };
    }).sort((a, b) => b.favoriteCount - a.favoriteCount);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get order history for each user
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({ user: user._id })
          .select('totalAmount orderStatus createdAt')
          .sort({ createdAt: -1 });
        
        return {
          ...user.toObject(),
          orderHistory: orders,
          totalOrders: orders.length,
          totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0)
        };
      })
    );
    
    res.json(usersWithOrders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user with order history
// @access  Private/Admin
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const orders = await Order.find({ user: user._id })
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    
    res.json({
      ...user.toObject(),
      orders
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id', async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.product', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// ==================== PAGE MANAGEMENT ROUTES ====================

// @route   GET /api/admin/pages
// @desc    Get all pages
// @access  Private/Admin
router.get('/pages', async (req, res, next) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json(pages);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/pages/:slug
// @desc    Get single page by slug
// @access  Private/Admin
router.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/pages
// @desc    Create new page
// @access  Private/Admin
router.post('/pages', async (req, res, next) => {
  try {
    const page = new Page(req.body);
    await page.save();
    res.status(201).json(page);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page with this slug already exists' });
    }
    next(error);
  }
});

// @route   PUT /api/admin/pages/:id
// @desc    Update page
// @access  Private/Admin
router.put('/pages/:id', async (req, res, next) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page with this slug already exists' });
    }
    next(error);
  }
});

// @route   DELETE /api/admin/pages/:id
// @desc    Delete page
// @access  Private/Admin
router.delete('/pages/:id', async (req, res, next) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/upload
// @desc    Upload image for pages
// @access  Private/Admin
router.post('/upload', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({
      imageUrl: `/uploads/${req.file.filename}`,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

// ==================== MESSAGE MANAGEMENT ROUTES ====================

// @route   GET /api/admin/messages
// @desc    Get all messages
// @access  Private/Admin
router.get('/messages', async (req, res, next) => {
  try {
    const { read, sortBy } = req.query;
    let query = {};
    
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    let sort = { createdAt: -1 }; // Default: newest first
    if (sortBy === 'oldest') {
      sort = { createdAt: 1 };
    }
    
    const messages = await Message.find(query).sort(sort);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/messages/:id
// @desc    Get single message by ID
// @access  Private/Admin
router.get('/messages/:id', async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/messages/:id/read
// @desc    Mark message as read
// @access  Private/Admin
router.put('/messages/:id/read', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/messages/:id/unread
// @desc    Mark message as unread
// @access  Private/Admin
router.put('/messages/:id/unread', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: false },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/messages/:id
// @desc    Delete a message
// @access  Private/Admin
router.delete('/messages/:id', async (req, res, next) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
