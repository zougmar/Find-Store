const mongoose = require('mongoose');

const orderRequestSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['new', 'contacted', 'completed', 'cancelled'],
    default: 'new'
  }
}, { timestamps: true });

module.exports = mongoose.model('OrderRequest', orderRequestSchema);
