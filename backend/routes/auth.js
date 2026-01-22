const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({ message: errorMessages });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists (case-insensitive)
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/google
// @desc    Register/Login with Google
// @access  Public
router.post('/google', async (req, res, next) => {
  try {
    const { googleId, email, name, image } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ message: 'Missing required Google information' });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, login
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || image || '',
        token: generateToken(user._id)
      });
    }

    // Check if user exists with this email
    user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      if (image && !user.image) {
        user.image = image;
      }
      await user.save();

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || '',
        token: generateToken(user._id)
      });
    }

    // Create new user with Google
    user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      googleId,
      image: image || '',
      password: Math.random().toString(36).slice(-12) // Random password for OAuth users
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    next(error);
  }
});

// @route   POST /api/auth/facebook
// @desc    Register/Login with Facebook
// @access  Public
router.post('/facebook', async (req, res, next) => {
  try {
    const { facebookId, email, name, image } = req.body;

    if (!facebookId || !email || !name) {
      return res.status(400).json({ message: 'Missing required Facebook information' });
    }

    // Check if user exists with this Facebook ID
    let user = await User.findOne({ facebookId });

    if (user) {
      // User exists, login
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || image || '',
        token: generateToken(user._id)
      });
    }

    // Check if user exists with this email
    user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Link Facebook account to existing user
      user.facebookId = facebookId;
      if (image && !user.image) {
        user.image = image;
      }
      await user.save();

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || '',
        token: generateToken(user._id)
      });
    }

    // Create new user with Facebook
    user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      facebookId,
      image: image || '',
      password: Math.random().toString(36).slice(-12) // Random password for OAuth users
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image || '',
      token: generateToken(user._id)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

