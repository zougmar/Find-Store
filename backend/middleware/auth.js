const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.error('User not found in database for token:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Log user info for debugging (without sensitive data)
      console.log('User authenticated:', {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      });
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ 
        message: 'Not authorized, token failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// Admin only routes
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Check if user has specific permission
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    // Full admins have all permissions
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Check if user has the specific permission
    if (req.user && req.user.permissions && req.user.permissions[permission] === true) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `Access denied. Required permission: ${permission}` 
    });
  };
};

// Check if user has any of the specified permissions
exports.hasAnyPermission = (...permissions) => {
  return (req, res, next) => {
    // Full admins have all permissions
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Check if user has any of the required permissions
    if (req.user && req.user.permissions) {
      const hasPermission = permissions.some(permission => 
        req.user.permissions[permission] === true
      );
      
      if (hasPermission) {
        return next();
      }
    }
    
    return res.status(403).json({ 
      message: `Access denied. Required one of: ${permissions.join(', ')}` 
    });
  };
};

