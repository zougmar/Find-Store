const express = require('express');
const Favorite = require('../models/Favorite');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/favorites/:productId
// @desc    Add product to favorites
// @access  Private
router.post('/:productId', async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: req.params.productId
    });

    if (favorite) {
      return res.status(400).json({ message: 'Product already in favorites' });
    }

    const newFavorite = await Favorite.create({
      user: req.user._id,
      product: req.params.productId
    });

    await newFavorite.populate('product', 'name images price');
    res.status(201).json(newFavorite);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/favorites/:productId
// @desc    Remove product from favorites
// @access  Private
router.delete('/:productId', async (req, res, next) => {
  try {
    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      product: req.params.productId
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Product removed from favorites' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product')
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/favorites/check/:productId
// @desc    Check if product is favorited
// @access  Private
router.get('/check/:productId', async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: req.params.productId
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

