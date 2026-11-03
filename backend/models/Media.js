const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
