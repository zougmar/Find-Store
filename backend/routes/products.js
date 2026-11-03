const express = require('express');
const { emitSync } = require('../services/activity');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');
const { generateUniqueSlug } = require('../utils/slug');
const { sanitizeProductBody } = require('../utils/productContent');

const router = express.Router();

const isObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) return false;
  return String(new mongoose.Types.ObjectId(value)) === String(value);
};

const findProductByIdOrSlug = async (param) => {
  if (isObjectId(param)) {
    const byId = await Product.findById(param);
    if (byId) return byId;
  }
  return Product.findOne({ slug: String(param || '').toLowerCase() });
};

const ensureSlug = async (product) => {
  if (!product || product.slug) return product;
  const slug = await generateUniqueSlug(Product, product.name, product._id);
  await Product.updateOne({ _id: product._id }, { $set: { slug } });
  product.slug = slug;
  return product;
};

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { category, subcategory, minPrice, maxPrice, minRating, search, sortBy } = req.query;
    
    let query = {};
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by subcategory
    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Filter by rating
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sort = {};
    if (sortBy === 'price-low') sort.price = 1;
    else if (sortBy === 'price-high') sort.price = -1;
    else if (sortBy === 'rating') sort.averageRating = -1;
    else sort.createdAt = -1;
    
    const products = await Product.find(query).sort(sort);
    const missingSlug = products.filter((product) => !product.slug);
    for (const product of missingSlug) {
      await ensureSlug(product);
    }
    
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/subcategories
// @desc    Get all subcategories for a category (or all subcategories if no category provided)
// @access  Public
router.get('/subcategories', async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    const subcategories = await Product.distinct('subcategory', query).then(subs => 
      subs.filter(sub => sub && sub.trim() !== '')
    );
    res.json(subcategories);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const product = await findProductByIdOrSlug(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await ensureSlug(product);
    await product.populate('ratings.user', 'name');
    
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, admin, async (req, res, next) => {
  try {
    const product = await Product.create(sanitizeProductBody(req.body));
    emitSync('products', { action: 'created', id: product._id });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res, next) => {
  try {
    const existing = await findProductByIdOrSlug(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = sanitizeProductBody(req.body);
    if (updates.slug) {
      updates.slug = await generateUniqueSlug(Product, updates.slug, existing._id);
    }

    const product = await Product.findByIdAndUpdate(
      existing._id,
      updates,
      { new: true, runValidators: true }
    );

    await ensureSlug(product);
    emitSync('products', { action: 'updated', id: product._id });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res, next) => {
  try {
    const existing = await findProductByIdOrSlug(req.params.id);
    const product = existing ? await Product.findByIdAndDelete(existing._id) : null;
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    emitSync('products', { action: 'deleted', id: product._id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
// @access  Private
router.post('/:id/reviews', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await findProductByIdOrSlug(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed
    const alreadyReviewed = product.ratings.find(
      (r) => r.user && r.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }
    
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    product.ratings.push({
      user: req.user._id,
      rating: numericRating,
      comment: String(comment || '').trim().slice(0, 1000),
      createdAt: new Date()
    });
    
    await product.save();
    await product.populate('ratings.user', 'name');
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

