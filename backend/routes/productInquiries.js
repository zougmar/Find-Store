const express = require('express');
const ProductInquiry = require('../models/ProductInquiry');
const Product = require('../models/Product');

const router = express.Router();

// @route   POST /api/product-inquiries
// @desc    Create a new product inquiry from product detail page
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { productId, fullName, phone, city, address, note } = req.body;

    if (!productId || !fullName || !phone || !city || !address) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const product = await Product.findById(productId).select('name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const inquiry = await ProductInquiry.create({
      product: product._id,
      productName: product.name,
      fullName,
      phone,
      city,
      address,
      note,
    });

    res.status(201).json({
      message: 'Request sent successfully',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

