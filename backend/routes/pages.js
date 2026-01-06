const express = require('express');
const Page = require('../models/Page');

const router = express.Router();

// @route   GET /api/pages/:slug
// @desc    Get published page by slug (public)
// @access  Public
router.get('/:slug', async (req, res, next) => {
  try {
    const page = await Page.findOne({ 
      slug: req.params.slug,
      published: true 
    });
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    
    res.json(page);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

