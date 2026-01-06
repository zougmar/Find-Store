const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  sections: [{
    id: String,
    type: {
      type: String,
      enum: ['hero', 'text', 'image', 'gallery', 'features', 'cta', 'custom'],
      default: 'text'
    },
    title: String,
    content: String,
    image: String,
    images: [String],
    backgroundImage: String,
    backgroundColor: String,
    textColor: String,
    fontSize: String,
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    order: {
      type: Number,
      default: 0
    },
    visible: {
      type: Boolean,
      default: true
    },
    styles: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  meta: {
    description: String,
    keywords: [String]
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Page', pageSchema);

