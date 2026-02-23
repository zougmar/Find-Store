const express = require('express');
const OrderRequest = require('../models/OrderRequest');
const Product = require('../models/Product');

const router = express.Router();

// @route   POST /api/requests
// @desc    Create a buy-now order request (no login)
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone, city, address, productId, quantity = 1 } = req.body;

    if (!customerName || !customerPhone || !city || !address || !productId) {
      return res.status(400).json({ message: 'Please provide name, phone, city, address, and product.' });
    }

    const product = await Product.findById(productId).select('name price images');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const request = await OrderRequest.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      city: city.trim(),
      address: address.trim(),
      product: productId,
      quantity: Math.max(1, parseInt(quantity, 10) || 1)
    });

    await request.populate('product', 'name price images');
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
