const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Favorite = require('../models/Favorite');
const Page = require('../models/Page');
const Message = require('../models/Message');
const { protect, admin, hasPermission, hasAnyPermission } = require('../middleware/auth');

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim()
  });
  console.log('Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME.trim());
}

const router = express.Router();

// All routes require authentication and admin or moderator with permissions
router.use(protect);
router.use((req, res, next) => {
  // Allow full admins
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  // Allow moderators with at least one permission
  if (req.user && req.user.role === 'moderator' && req.user.permissions) {
    const hasAnyPerm = Object.values(req.user.permissions).some(perm => perm === true);
    if (hasAnyPerm) {
      return next();
    }
  }
  
  return res.status(403).json({ message: 'Access denied. Admin or moderator with permissions required.' });
});

// Configure multer for file uploads
// Use memory storage for Vercel/serverless compatibility
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit (for videos)
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|webm|ogg|mov|avi|mkv/;
    const extname = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mimetype = file.mimetype;
    
    const isImage = allowedImageTypes.test(extname) || mimetype.startsWith('image/');
    const isVideo = allowedVideoTypes.test(extname) || mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder = 'products', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folder,
      resource_type: resourceType, // 'auto' detects image or video automatically
    };
    
    // Only add image transformations for images
    if (resourceType === 'image' || resourceType === 'auto') {
      options.transformation = [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ];
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    const stream = streamifier.createReadStream(buffer);
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      reject(err);
    });
    
    stream.pipe(uploadStream);
  });
};

// Helper function to save locally (for development)
const saveLocalFile = (buffer, originalName) => {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = 'product-' + uniqueSuffix + path.extname(originalName);
  const filepath = path.join(uploadDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
};

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin or Moderator with viewDashboard permission
router.get('/dashboard', hasPermission('viewDashboard'), async (req, res, next) => {
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
// @access  Private/Admin or Moderator with manageUsers permission
router.get('/users', hasPermission('manageUsers'), async (req, res, next) => {
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

// @route   GET /api/admin/users/all
// @desc    Get all users (including admins and moderators)
// @access  Private/Admin or Moderator with manageUsers permission
router.get('/users/all', hasPermission('manageUsers'), async (req, res, next) => {
  try {
    const users = await User.find()
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

// @route   POST /api/admin/users
// @desc    Create new admin/moderator user
// @access  Private/Admin or Moderator with manageUsers permission
router.post('/users', hasPermission('manageUsers'), async (req, res, next) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Only admins can create admin users
    const userRole = (req.user.role === 'admin' && role === 'admin') ? 'admin' : (role || 'moderator');

    // Create user
    const userData = {
      name,
      email: email.toLowerCase().trim(),
      password,
      phone,
      role: userRole
    };

    // Add permissions if provided
    if (permissions) {
      userData.permissions = permissions;
    }

    const user = await User.create(userData);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
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
// @desc    Update user (including permissions)
// @access  Private/Admin or Moderator with manageUsers permission
router.put('/users/:id', hasPermission('manageUsers'), async (req, res, next) => {
  try {
    // Don't allow non-admins to change role to admin
    if (req.user.role !== 'admin' && req.body.role === 'admin') {
      return res.status(403).json({ message: 'Only admins can assign admin role' });
    }
    
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
// @access  Private/Admin or Moderator with manageOrders permission
router.get('/orders', hasPermission('manageOrders'), async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images')
      .populate('assignedDeliveryMan', 'name email phone')
      .populate('changeHistory.changedBy', 'name email role')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/delivery-men
// @desc    Get all delivery men
// @access  Private/Admin or Moderator with manageOrders permission
router.get('/delivery-men', hasPermission('manageOrders'), async (req, res, next) => {
  try {
    const deliveryMen = await User.find({ role: 'delivery' })
      .select('name email phone image')
      .sort({ name: 1 });
    
    res.json(deliveryMen);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order status and assign delivery man
// @access  Private/Admin or Moderator with manageOrders permission
router.put('/orders/:id', hasPermission('manageOrders'), async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, assignedDeliveryMan } = req.body;
    
    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (assignedDeliveryMan !== undefined) {
      updateData.assignedDeliveryMan = assignedDeliveryMan || null;
      // If assigning a delivery man, set initial delivery status
      if (assignedDeliveryMan && !updateData.deliveryStatus) {
        updateData.deliveryStatus = 'pending';
      }
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email phone image address')
      .populate('items.product', 'name images')
      .populate('assignedDeliveryMan', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete a single order
// @access  Private/Admin or Moderator with manageOrders permission
router.delete('/orders/:id', hasPermission('manageOrders'), async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Restore product stock if order was not cancelled
    if (order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/orders
// @desc    Delete all orders or selected orders
// @access  Private/Admin or Moderator with manageOrders permission
router.delete('/orders', hasPermission('manageOrders'), async (req, res, next) => {
  try {
    const { orderIds } = req.body;
    
    let deletedCount = 0;
    
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Delete selected orders
      const ordersToDelete = await Order.find({ _id: { $in: orderIds } });
      
      // Restore product stock for non-cancelled orders
      for (const order of ordersToDelete) {
        if (order.orderStatus !== 'cancelled') {
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock += item.quantity;
              await product.save();
            }
          }
        }
      }
      
      const result = await Order.deleteMany({ _id: { $in: orderIds } });
      deletedCount = result.deletedCount;
    } else {
      // Delete all orders
      const allOrders = await Order.find();
      
      // Restore product stock for non-cancelled orders
      for (const order of allOrders) {
        if (order.orderStatus !== 'cancelled') {
          for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
              product.stock += item.quantity;
              await product.save();
            }
          }
        }
      }
      
      const result = await Order.deleteMany({});
      deletedCount = result.deletedCount;
    }
    
    res.json({ 
      message: `${deletedCount} order(s) deleted successfully`,
      deletedCount 
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PAGE MANAGEMENT ROUTES ====================

// @route   GET /api/admin/pages
// @desc    Get all pages
// @access  Private/Admin or Moderator with managePages permission
router.get('/pages', hasPermission('managePages'), async (req, res, next) => {
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
// @access  Private/Admin or Moderator with managePages permission
router.post('/pages', hasPermission('managePages'), async (req, res, next) => {
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
// @access  Private/Admin or Moderator with managePages permission
router.put('/pages/:id', hasPermission('managePages'), async (req, res, next) => {
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

// @route   GET /api/admin/test-cloudinary
// @desc    Test Cloudinary configuration
// @access  Private/Admin
router.get('/test-cloudinary', async (req, res, next) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(400).json({
        configured: false,
        message: 'Cloudinary environment variables are not set',
        required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      });
    }

    const config = cloudinary.config();
    if (!config.cloud_name) {
      return res.status(400).json({
        configured: false,
        message: 'Cloudinary is not properly configured'
      });
    }

    // Test upload with a small test image (1x1 transparent PNG)
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    try {
      const result = await uploadToCloudinary(testImage, 'test', 'image');
      res.json({
        configured: true,
        valid: true,
        message: 'Cloudinary credentials are valid',
        cloud_name: config.cloud_name,
        test_url: result.secure_url
      });
    } catch (error) {
      res.status(401).json({
        configured: true,
        valid: false,
        message: 'Cloudinary credentials are invalid',
        error: error.message,
        http_code: error.http_code,
        cloud_name: config.cloud_name,
        suggestion: 'Please verify your CLOUDINARY_API_SECRET in Vercel environment variables. Make sure there are no extra spaces or characters.'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/upload
// @desc    Upload image or video for products/pages
// @access  Private/Admin
router.post('/upload', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Determine if file is image or video
    const mimetype = req.file.mimetype;
    const isVideo = mimetype.startsWith('video/');
    const isImage = mimetype.startsWith('image/');
    const resourceType = isVideo ? 'video' : (isImage ? 'image' : 'auto');
    
    console.log('Uploading file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      resourceType: resourceType
    });
    
    let fileUrl;
    
    // Use Cloudinary if configured (production/Vercel)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        // Verify Cloudinary is configured
        const cloudinaryConfig = cloudinary.config();
        if (!cloudinaryConfig.cloud_name) {
          throw new Error('Cloudinary is not properly configured. Check your environment variables.');
        }
        
        console.log('Uploading to Cloudinary...', {
          cloud_name: cloudinaryConfig.cloud_name,
          file_size: req.file.size,
          resource_type: resourceType
        });
        
        const result = await uploadToCloudinary(req.file.buffer, 'products', resourceType);
        fileUrl = result.secure_url;
        console.log('Upload successful:', fileUrl);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error details:', {
          message: cloudinaryError.message,
          http_code: cloudinaryError.http_code,
          name: cloudinaryError.name,
          error: cloudinaryError.error || cloudinaryError
        });
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to upload file to cloud storage';
        if (cloudinaryError.http_code === 401) {
          errorMessage = 'Cloudinary authentication failed. Please check your API key and secret.';
        } else if (cloudinaryError.http_code === 400) {
          errorMessage = 'Invalid file format or Cloudinary configuration error.';
        } else if (cloudinaryError.message) {
          errorMessage = cloudinaryError.message;
        }
        
        return res.status(500).json({ 
          message: errorMessage,
          error: cloudinaryError.message || 'Unknown Cloudinary error',
          http_code: cloudinaryError.http_code
        });
      }
    } else {
      // Fallback to local storage (development only)
      // Note: This won't work on Vercel, Cloudinary is required
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isVercel || isProduction) {
        return res.status(500).json({ 
          message: 'Cloudinary configuration is required for production/Vercel deployment. Please set the following environment variables in Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET. See CLOUDINARY_SETUP.md for detailed instructions.',
          error: 'MISSING_CLOUDINARY_CONFIG',
          required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
        });
      }
      fileUrl = saveLocalFile(req.file.buffer, req.file.originalname);
    }
    
    res.json({
      imageUrl: fileUrl, // Keep 'imageUrl' for backward compatibility
      fileUrl: fileUrl,
      filename: req.file.originalname,
      type: isVideo ? 'video' : 'image'
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
});

// ==================== MESSAGE MANAGEMENT ROUTES ====================

// @route   GET /api/admin/messages
// @desc    Get all messages
// @access  Private/Admin or Moderator with manageMessages permission
router.get('/messages', hasPermission('manageMessages'), async (req, res, next) => {
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
