const mongoose = require('mongoose');
const { generateUniqueSlug } = require('../utils/slug');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    index: true
  },
  headline: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    set(value) {
      if (value === '' || value == null) return 0
      const number = Number(String(value).trim().replace(/\s/g, '').replace(',', '.'))
      if (!Number.isFinite(number)) return value
      return Math.round(number * 100) / 100
    }
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String
  }],
  features: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  specifications: [{
    label: { type: String, trim: true },
    value: { type: String, trim: true }
  }],
  faqs: [{
    question: { type: String, trim: true },
    answer: { type: String, trim: true }
  }],
  deliveryNote: {
    type: String,
    trim: true,
    default: ''
  },
  supportNote: {
    type: String,
    trim: true,
    default: ''
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: { type: Date }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate average rating before saving
productSchema.pre('save', async function() {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = (sum / this.ratings.length).toFixed(1);
    this.numReviews = this.ratings.length;
  }

  if (!this.slug) {
    this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
  }
});

module.exports = mongoose.model('Product', productSchema);

