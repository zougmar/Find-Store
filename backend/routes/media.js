const express = require('express');
const mongoose = require('mongoose');
const Media = require('../models/Media');

const router = express.Router();

// Public file serving. The id is unguessable and the file contains no account data.
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'File not found' });
    }

    const media = await Media.findById(req.params.id).select('data contentType');
    if (!media) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', media.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(media.data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
